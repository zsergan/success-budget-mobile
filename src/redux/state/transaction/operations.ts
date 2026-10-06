import { randomUUID } from 'expo-crypto';

import type { CreateTransactionRequest, ErrorResponse, UpdateTransactionRequest } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import type { CreateTransactionResult, UpdateTransactionResult } from '@api/models';
import type { AppThunk, RootState } from '@redux/Store';
import { TransactionType } from '@shared/enums';
import { loseSpaceAccess } from '../space/thunks';
import { transactionApi } from './api';

// What the user asked for, tied to the space the draft belongs to.
export type TransactionRequest =
  | { type: 'create'; spaceId: number; data: CreateTransactionRequest }
  | { type: 'update'; spaceId: number; transactionId: string; version: number; data: UpdateTransactionRequest }
  | { type: 'delete'; spaceId: number; transactionId: string; version: number };

type RequestType = TransactionRequest['type'];

// A request as sent once: retrying it sends exactly this again, key included.
export type TransactionOperation = Readonly<TransactionRequest & { sessionKey: number; idempotencyKey: string }>;

interface OperationResults {
  create: CreateTransactionResult;
  update: UpdateTransactionResult;
  delete: null;
}

// `uncertain`: no answer, or a server failure; the write may or may not have applied.
export type TransactionFailureKind = 'validation' | 'conflict' | 'notFound' | 'accessLost' | 'uncertain' | 'rejected';

export interface TransactionFailure {
  kind: TransactionFailureKind;
  error: unknown;
}

// `stale`: the session or the space changed meanwhile, so nothing may surface in the current one.
export type OperationOutcome<T extends RequestType = RequestType> =
  | { status: 'succeeded'; result: OperationResults[T] }
  | { status: 'failed'; failure: TransactionFailure; operation: TransactionOperation }
  | { status: 'stale' };

// What one draft's attempts left behind; a success hands back null, so the next draft starts clean.
export interface OperationMemory {
  sessionKey: number;
  spaceId: number;
  unresolved: { operation: TransactionOperation; failure: TransactionFailure } | null;
  // The record this draft's own writes produced, so a later save edits it instead of creating another.
  record: { transactionId: string; version: number; created: CreateTransactionResult | null } | null;
}

export const classifyTransactionError = (error: unknown): TransactionFailureKind => {
  const { statusCode, code } = (error ?? {}) as Partial<ErrorResponse>;

  if (typeof statusCode !== 'number' || statusCode === 0 || statusCode === 408 || statusCode >= 500) return 'uncertain';
  if (code === ApiErrorCode.TRANSACTION_VERSION_CONFLICT) return 'conflict';
  if (code === ApiErrorCode.TRANSACTION_NOT_FOUND) return 'notFound';
  if (code === ApiErrorCode.FORBIDDEN_SPACE) return 'accessLost';
  if (statusCode === 400 || code === ApiErrorCode.FORBIDDEN_WALLET || code === ApiErrorCode.FORBIDDEN_CATEGORY) {
    return 'validation';
  }

  return 'rejected';
};

// The server refused it as sent, so it is known not to have applied.
const isRefusal = ({ kind }: TransactionFailure) => kind === 'validation' || kind === 'rejected';

const isInScope = (state: RootState, { sessionKey, spaceId }: Pick<OperationMemory, 'sessionKey' | 'spaceId'>) =>
  state.auth.sessionKey === sessionKey && state.space.currentSpaceId === spaceId;

const send = async (operation: TransactionOperation, dispatch: Parameters<AppThunk>[0]) => {
  const { spaceId, idempotencyKey } = operation;
  const { createTransaction, updateTransaction, deleteTransaction } = transactionApi.endpoints;

  switch (operation.type) {
    case 'create':
      return dispatch(
        createTransaction.initiate({ spaceId, idempotencyKey, data: operation.data }, { track: false }),
      ).unwrap();
    case 'update': {
      const { transactionId, version, data } = operation;

      return dispatch(
        updateTransaction.initiate({ spaceId, idempotencyKey, transactionId, version, data }, { track: false }),
      ).unwrap();
    }
    case 'delete': {
      const { transactionId, version } = operation;

      await dispatch(
        deleteTransaction.initiate({ spaceId, idempotencyKey, transactionId, version }, { track: false }),
      ).unwrap();

      return null;
    }
  }
};

export const runTransactionOperation =
  (operation: TransactionOperation): AppThunk<Promise<OperationOutcome>> =>
  async (dispatch, getState) => {
    if (!isInScope(getState(), operation)) return { status: 'stale' };

    try {
      const result = await send(operation, dispatch);

      return isInScope(getState(), operation) ? { status: 'succeeded', result } : { status: 'stale' };
    } catch (error) {
      if (!isInScope(getState(), operation) || (error as Partial<ErrorResponse>)?.isStale) return { status: 'stale' };

      const failure = { kind: classifyTransactionError(error), error };

      // Gone already, by an earlier attempt or another member: what the delete asked for is true.
      if (operation.type === 'delete' && failure.kind === 'notFound') return { status: 'succeeded', result: null };
      if (failure.kind === 'accessLost') dispatch(loseSpaceAccess(operation.spaceId));

      return { status: 'failed', failure, operation };
    }
  };

const createOperation = (request: TransactionRequest, sessionKey: number): TransactionOperation =>
  Object.freeze({
    ...request,
    ...('data' in request && { data: Object.freeze({ ...request.data }) }),
    sessionKey,
    idempotencyKey: randomUUID(),
  }) as TransactionOperation;

const isSameRequest = (operation: TransactionOperation, request: TransactionRequest) => {
  if (operation.type !== request.type || operation.spaceId !== request.spaceId) return false;
  if ('transactionId' in operation && 'transactionId' in request) {
    if (operation.transactionId !== request.transactionId || operation.version !== request.version) return false;
  }

  const sent: Record<string, unknown> = 'data' in operation ? operation.data : {};
  const asked: Record<string, unknown> = 'data' in request ? request.data : {};
  const keys = new Set([...Object.keys(sent), ...Object.keys(asked)]);

  return [...keys].every((key) => sent[key] === asked[key]);
};

// Once this draft has created or edited the record, a later save goes to that record at its new version.
const toEffectiveRequest = (request: TransactionRequest, { record }: OperationMemory): TransactionRequest => {
  if (!record) return request;

  if (request.type === 'create') {
    const { spaceId, data } = request;

    return {
      type: 'update',
      spaceId,
      transactionId: record.transactionId,
      version: record.version,
      data: { ...data, description: data.description ?? null },
    };
  }

  return request.transactionId === record.transactionId && record.version > request.version
    ? { ...request, version: record.version }
    : request;
};

const remember = (memory: OperationMemory, operation: TransactionOperation, outcome: OperationOutcome) => {
  if (outcome.status === 'stale') return memory;
  if (outcome.status === 'failed') return { ...memory, unresolved: { operation, failure: outcome.failure } };

  const record = (() => {
    switch (operation.type) {
      case 'create': {
        const created = outcome.result as CreateTransactionResult;

        return { transactionId: created.transaction.id, version: created.transaction.version, created };
      }
      case 'update': {
        const { transaction } = outcome.result as UpdateTransactionResult;

        return { transactionId: transaction.id, version: transaction.version, created: memory.record?.created ?? null };
      }
      case 'delete':
        return null;
    }
  })();

  return { ...memory, unresolved: null, record };
};

// A create that ended up as an edit of the record it had already made still answers as a create.
const asCreateResult = (
  { transaction, wallets }: UpdateTransactionResult,
  created: CreateTransactionResult | null,
): CreateTransactionResult => {
  const walletId = transaction.wallet?.id ?? created?.wallet.id;
  const balance = wallets.find(({ id }) => id === walletId)?.balance ?? created?.wallet.balance ?? 0;
  const sign = transaction.transactionType === TransactionType.EXPENSE ? -1 : 1;
  const wallet = transaction.wallet ?? created!.wallet;

  return {
    transaction,
    wallet: { id: wallet.id, wallet_name: wallet.wallet_name, design: wallet.design, balance },
    previousBalance: balance - sign * Number(transaction.amount),
  };
};

export interface Submission<T extends RequestType> {
  outcome: OperationOutcome<T>;
  memory: OperationMemory | null;
}

// The same request again reuses its operation and key. A changed one after an uncertain attempt first
// settles that attempt with its own key, then sends the change against whatever it turned out to do.
export const submitTransactionRequest =
  <T extends RequestType>(
    request: Extract<TransactionRequest, { type: T }>,
    previous: OperationMemory | null,
  ): AppThunk<Promise<Submission<T>>> =>
  async (dispatch, getState) => {
    const { sessionKey } = getState().auth;
    const { spaceId } = request;
    const isSameScope = previous?.sessionKey === sessionKey && previous.spaceId === spaceId;
    let memory: OperationMemory = isSameScope ? previous : { sessionKey, spaceId, unresolved: null, record: null };
    const pending = memory.unresolved;

    if (pending && !isSameRequest(pending.operation, toEffectiveRequest(request, memory))) {
      if (pending.failure.kind === 'uncertain') {
        const prior = await dispatch(runTransactionOperation(pending.operation));

        memory = remember(memory, pending.operation, prior);

        if (prior.status === 'stale' || (prior.status === 'failed' && !isRefusal(prior.failure))) {
          return { outcome: prior as OperationOutcome<T>, memory };
        }
      }

      memory = { ...memory, unresolved: null };
    }

    const effective = toEffectiveRequest(request, memory);
    const operation =
      memory.unresolved && isSameRequest(memory.unresolved.operation, effective)
        ? memory.unresolved.operation
        : createOperation(effective, sessionKey);
    const outcome = await dispatch(runTransactionOperation(operation));

    if (outcome.status !== 'succeeded') {
      return { outcome: outcome as OperationOutcome<T>, memory: remember(memory, operation, outcome) };
    }

    const result =
      request.type === 'create' && operation.type === 'update'
        ? asCreateResult(outcome.result as UpdateTransactionResult, memory.record?.created ?? null)
        : outcome.result;

    return { outcome: { status: 'succeeded', result: result as OperationResults[T] }, memory: null };
  };
