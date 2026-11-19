import { randomUUID } from 'expo-crypto';

import type { CreateTransactionRequest, ErrorResponse, UpdateTransactionRequest } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import type { TransactionModel, TransactionWriteResult } from '@api/models';
import { spaceTags } from '@redux/api/baseApi';
import type { AppThunk, RootState } from '@redux/Store';
import { IDEMPOTENCY_KEY_LIFETIME_MS } from '@shared/constants';
import { selectPendingWrite, selectUnsettledRecordWrites } from '../pendingWrite/selectors';
import type { PendingWriteStatus } from '../pendingWrite/slice';
import { writeRecorded, writeSettled } from '../pendingWrite/slice';
import { forgetPendingWrite, persistPendingWrites } from '../pendingWrite/storage';
import { selectProfileId } from '../profile/selectors';
import { loseSpaceAccess } from '../space/thunks';
import { TRANSACTION_WRITE_TAGS, transactionApi } from './api';

// What the user asked for, tied to the space the draft belongs to. A create sent again for an operation an older
// build started keeps that operation's id (`operationId`), so it can apply only once.
export type TransactionRequest =
  | { type: 'create'; spaceId: number; data: CreateTransactionRequest; operationId?: string }
  | { type: 'update'; spaceId: number; transactionId: string; version: number; data: UpdateTransactionRequest }
  | { type: 'delete'; spaceId: number; transactionId: string; version: number };

type RequestType = TransactionRequest['type'];

// `recovered`: a create sent under an operation id an older build or an earlier refusal left; until the server
// confirms its outcome it stays stored for the user to retry, and an unknown outcome is looked up before it is resent.
type StoredRequest =
  | { type: 'create'; spaceId: number; data: CreateTransactionRequest; recovered?: true }
  | Exclude<TransactionRequest, { type: 'create' }>;

// A request as sent once: retrying it sends exactly this again, key included. A create carries its key as
// `client_operation_id` too. `firstSentAt` starts the key's lifetime on the server.
export type StoredOperation = StoredRequest & { idempotencyKey: string; firstSentAt: number };

export type TransactionOperation = Readonly<StoredOperation & { sessionKey: number }>;

// Past the key's lifetime a create is looked up by its operation id, never resent.
export const KEY_LIFETIME_MS = IDEMPOTENCY_KEY_LIFETIME_MS;

interface OperationResults {
  create: TransactionWriteResult;
  update: TransactionWriteResult;
  delete: null;
}

// `uncertain`: no answer, or a server failure; the write may or may not have applied.
// `expired`: a create whose key ran out with no trace of it on the server; only the user sends it again.
// `notSent`: it could not be stored first, so it never went out.
// `blocked`: not sent, as an earlier edit or delete of the same record still has no known outcome.
export type TransactionFailureKind =
  'validation' | 'conflict' | 'notFound' | 'accessLost' | 'uncertain' | 'rejected' | 'expired' | 'notSent' | 'blocked';

export interface TransactionFailure {
  kind: TransactionFailureKind;
  error: unknown;
}

// `stale`: the session or the space changed meanwhile, so nothing may surface in the current one.
// `wasGone`: a delete that found the record already gone, by an earlier attempt or another member.
// `found`: an earlier attempt of the create applied; the record is null when it was deleted since.
// `recovered`: an unconfirmed earlier attempt turned out to have made this record, so the changed request, whose
// meaning that changes, was not sent.
export type OperationOutcome<T extends RequestType = RequestType> =
  | { status: 'succeeded'; result: OperationResults[T]; wasGone?: true }
  | { status: 'found'; transaction: TransactionModel | null }
  | { status: 'recovered'; transaction: TransactionModel }
  | { status: 'failed'; failure: TransactionFailure; operation: TransactionOperation }
  | { status: 'stale' };

// What one draft's attempts left behind; a success hands back null, so the next draft starts clean.
export interface OperationMemory {
  sessionKey: number;
  spaceId: number;
  unresolved: { operation: TransactionOperation; failure: TransactionFailure } | null;
}

export const classifyTransactionError = (error: unknown): TransactionFailureKind => {
  const { statusCode, code } = (error ?? {}) as Partial<ErrorResponse>;

  if (typeof statusCode !== 'number' || statusCode === 0 || statusCode === 408 || statusCode >= 500) return 'uncertain';
  if (code === ApiErrorCode.TRANSACTION_VERSION_CONFLICT) return 'conflict';
  if (code === ApiErrorCode.TRANSACTION_NOT_FOUND) return 'notFound';
  if (code === ApiErrorCode.FORBIDDEN_SPACE) return 'accessLost';
  if (statusCode === 400 || code === ApiErrorCode.FORBIDDEN_CATEGORY) {
    return 'validation';
  }

  return 'rejected';
};

// The server refused it as sent, or it never went out, so it is known not to have applied.
const isRefusal = ({ kind }: TransactionFailure) =>
  kind === 'validation' || kind === 'rejected' || kind === 'expired' || kind === 'notSent';

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

// What one attempt found out. `unknown`: no answer, or a server failure. `stale`: the session ended meanwhile.
export type WriteResult =
  | { kind: 'done'; result: OperationResults[RequestType] }
  | { kind: 'applied'; transaction: TransactionModel }
  | { kind: 'deleted' }
  | { kind: 'refused'; error: unknown }
  | { kind: 'unknown'; error: unknown }
  | { kind: 'expired' }
  | { kind: 'notSent' }
  | { kind: 'stale' };

const errorOf = (error: unknown) => (error ?? {}) as Partial<ErrorResponse>;

// Only the operation id tells whether a create applied; `missing` is what the server having no trace of it means.
export const lookUpCreate =
  (operation: TransactionOperation, missing: WriteResult): AppThunk<Promise<WriteResult>> =>
  async (dispatch) => {
    try {
      const { transaction } = await dispatch(
        transactionApi.endpoints.getTransactionOperation.initiate(
          { spaceId: operation.spaceId, operationId: operation.idempotencyKey },
          { subscribe: false, forceRefetch: true },
        ),
      ).unwrap();

      dispatch(transactionApi.util.invalidateTags(spaceTags(operation.spaceId, ...TRANSACTION_WRITE_TAGS)));

      return transaction ? { kind: 'applied', transaction } : { kind: 'deleted' };
    } catch (error) {
      if (errorOf(error).isStale) return { kind: 'stale' };
      if (errorOf(error).code === ApiErrorCode.TRANSACTION_OPERATION_NOT_FOUND) return missing;

      return classifyTransactionError(error) === 'uncertain' ? { kind: 'unknown', error } : { kind: 'refused', error };
    }
  };

export const isRecoveredCreate = (operation: StoredOperation) =>
  operation.type === 'create' && operation.recovered === true;

const attemptWrite =
  (operation: TransactionOperation, isRetry: boolean, lookUpFirst: boolean): AppThunk<Promise<WriteResult>> =>
  async (dispatch) => {
    const isCreate = operation.type === 'create';

    if (isCreate && Date.now() - operation.firstSentAt >= KEY_LIFETIME_MS) {
      return dispatch(lookUpCreate(operation, { kind: 'expired' }));
    }
    if (lookUpFirst) {
      const missing: WriteResult = { kind: 'expired' };
      const found = await dispatch(lookUpCreate(operation, missing));
      if (found !== missing) return found;
    }

    try {
      return { kind: 'done', result: await send(operation, dispatch) };
    } catch (error) {
      const { isStale, code, statusCode } = errorOf(error);

      if (isStale) return { kind: 'stale' };
      if (classifyTransactionError(error) === 'uncertain') return { kind: 'unknown', error };

      // The id is taken, the key went with another body, or a resend is refused although the first attempt may have
      // applied: ask what it did.
      if (
        isCreate &&
        (code === ApiErrorCode.TRANSACTION_OPERATION_EXISTS || code === ApiErrorCode.IDEMPOTENCY_KEY_REUSED)
      ) {
        return dispatch(lookUpCreate(operation, { kind: 'unknown', error }));
      }
      if (isCreate && (isRetry || isRecoveredCreate(operation)) && (statusCode === 400 || statusCode === 403)) {
        return dispatch(lookUpCreate(operation, { kind: 'refused', error }));
      }

      return { kind: 'refused', error };
    }
  };

const toStored = ({ sessionKey: _sessionKey, ...stored }: TransactionOperation): StoredOperation => stored;

// A recovered create is not dropped until its outcome is confirmed: a refusal keeps its draft for the user to fix, and
// no answer, a rate limit or an ended session leave it to be looked up before anything is sent again.
const recoveredStatus = (result: WriteResult): Exclude<PendingWriteStatus, 'sending'> | null => {
  switch (result.kind) {
    case 'unknown':
      return 'checking';
    case 'refused':
      return classifyTransactionError(result.error) === 'accessLost' ? 'accessLost' : 'retry';
    case 'expired':
      return 'retry';
    default:
      return null;
  }
};

const isOutcomeUnknown = (error: unknown) => {
  const { statusCode } = errorOf(error);

  return classifyTransactionError(error) === 'uncertain' || statusCode === 401 || statusCode === 429;
};

// Stores the write before it goes out and keeps it until its outcome is known, through a closed form or a restart.
// Nothing is sent when it cannot be stored first.
export const settleWrite =
  (operation: TransactionOperation): AppThunk<Promise<WriteResult>> =>
  (dispatch, getState, { runningWrites }) => {
    if (getState().auth.sessionKey !== operation.sessionKey) return Promise.resolve({ kind: 'stale' });
    const key = operation.idempotencyKey;
    const running = runningWrites.get(key) as Promise<WriteResult> | undefined;
    if (running) return running;

    const run = (async (): Promise<WriteResult> => {
      const userId = selectProfileId(getState()) ?? getState().pendingWrite.userId ?? undefined;
      if (userId === undefined) return { kind: 'notSent' };

      const previous = selectPendingWrite(getState(), key);
      const isRetry = previous !== undefined;
      const isRecovered = isRecoveredCreate(operation);

      dispatch(writeRecorded({ userId, operation: toStored(operation) }));
      const persisted = await dispatch(persistPendingWrites());
      if (getState().auth.sessionKey !== operation.sessionKey || getState().pendingWrite.userId !== userId) {
        return { kind: 'stale' };
      }
      // A recovered create goes out only as stored, so a restart never finds an older body than the one sent.
      if (!persisted && (!isRetry || isRecovered)) {
        if (previous && previous.status !== 'sending') {
          dispatch(writeRecorded({ userId, operation: previous.operation }));
          dispatch(writeSettled({ key, status: previous.status, found: previous.found }));
        } else {
          dispatch(writeSettled({ key, status: null }));
        }
        return { kind: 'notSent' };
      }

      let result = await dispatch(attemptWrite(operation, isRetry, isRecovered && previous?.status === 'checking'));
      if (isRecovered && result.kind === 'refused' && isOutcomeUnknown(result.error)) {
        result = { kind: 'unknown', error: result.error };
      }

      // After a logout the stored write waits for the same user's next session.
      if (result.kind === 'stale' || getState().pendingWrite.userId !== userId) return result;

      const isAccessLost = result.kind === 'refused' && classifyTransactionError(result.error) === 'accessLost';
      // A create whose space is gone stays with that space, for the user to see it can be saved nowhere.
      const status = isRecovered
        ? recoveredStatus(result)
        : result.kind === 'unknown'
          ? 'unknown'
          : result.kind === 'expired'
            ? 'expired'
            : isAccessLost && operation.type === 'create'
              ? 'accessLost'
              : null;

      dispatch(writeSettled({ key, status }));
      await dispatch(persistPendingWrites());

      if (isAccessLost) dispatch(loseSpaceAccess(operation.spaceId));

      return result;
    })().finally(() => runningWrites.delete(key));

    runningWrites.set(key, run);

    return run;
  };

export const runTransactionOperation =
  (operation: TransactionOperation): AppThunk<Promise<OperationOutcome>> =>
  async (dispatch, getState) => {
    if (!isInScope(getState(), operation)) return { status: 'stale' };

    const result = await dispatch(settleWrite(operation));

    if (result.kind === 'stale' || !isInScope(getState(), operation)) return { status: 'stale' };

    const fail = (failure: TransactionFailure): OperationOutcome => ({ status: 'failed', failure, operation });

    switch (result.kind) {
      case 'done':
        return { status: 'succeeded', result: result.result };
      case 'applied':
        return { status: 'found', transaction: result.transaction };
      case 'deleted':
        return { status: 'found', transaction: null };
      case 'unknown':
        return fail({ kind: 'uncertain', error: result.error });
      case 'expired':
      case 'notSent':
        return fail({ kind: result.kind, error: null });
      case 'refused': {
        const failure = { kind: classifyTransactionError(result.error), error: result.error };

        // Gone already, by an earlier attempt or another member: what the delete asked for is true.
        if (operation.type === 'delete' && failure.kind === 'notFound') {
          return { status: 'succeeded', result: null, wasGone: true };
        }

        return fail(failure);
      }
    }
  };

const createOperation = (request: TransactionRequest, sessionKey: number): TransactionOperation => {
  const idempotencyKey = (request.type === 'create' && request.operationId) || randomUUID();
  const data =
    request.type === 'create'
      ? { ...request.data, client_operation_id: idempotencyKey }
      : 'data' in request && { ...request.data };

  const { operationId, ...asked } = request as TransactionRequest & { operationId?: string };

  return Object.freeze({
    ...asked,
    ...(operationId && { recovered: true }),
    ...(data && { data: Object.freeze(data) }),
    sessionKey,
    idempotencyKey,
    firstSentAt: Date.now(),
  }) as TransactionOperation;
};

// Sending an expired create again is the user's call; it starts a new key lifetime under the same operation id.
const renewOperation = (operation: TransactionOperation): TransactionOperation =>
  Object.freeze({ ...operation, firstSentAt: Date.now() });

const isSameRequest = (operation: TransactionOperation, request: TransactionRequest) => {
  if (operation.type !== request.type || operation.spaceId !== request.spaceId) return false;
  if ('transactionId' in operation && 'transactionId' in request) {
    if (operation.transactionId !== request.transactionId || operation.version !== request.version) return false;
  }

  const sent: Record<string, unknown> = 'data' in operation ? operation.data : {};
  const asked: Record<string, unknown> = 'data' in request ? request.data : {};
  const keys = new Set([...Object.keys(sent), ...Object.keys(asked)]);
  keys.delete('client_operation_id');

  // Values are plain JSON; the assignment is an object, equal when its fields are.
  return [...keys].every((key) => JSON.stringify(sent[key]) === JSON.stringify(asked[key]));
};

const remember = (memory: OperationMemory, operation: TransactionOperation, outcome: OperationOutcome) =>
  outcome.status === 'failed' ? { ...memory, unresolved: { operation, failure: outcome.failure } } : memory;

// The record an earlier attempt turned out to have made or changed.
const recordOf = (outcome: OperationOutcome): TransactionModel | null => {
  if (outcome.status === 'found' || outcome.status === 'recovered') return outcome.transaction;
  if (outcome.status !== 'succeeded' || !outcome.result) return null;

  return (outcome.result as TransactionWriteResult).transaction;
};

// An edit or a delete of a record waits for the earlier ones of it whose outcome is unknown, those not read back yet
// after a restart included: each is settled first with its own key and version. One still unknown blocks this one.
const settleEarlierWrites =
  (request: TransactionRequest, ownKey: string | undefined): AppThunk<Promise<WriteResult | null>> =>
  async (dispatch, getState, { restoringWrites }) => {
    if (request.type === 'create') return null;

    const userId = selectProfileId(getState());
    const restoring = userId === undefined ? undefined : restoringWrites.get(userId);
    if (restoring) await restoring.catch(() => undefined);

    const { sessionKey } = getState().auth;
    const earlier = selectUnsettledRecordWrites(getState(), request.spaceId, request.transactionId).filter(
      ({ operation }) => operation.idempotencyKey !== ownKey,
    );

    for (const { operation } of earlier) {
      const result = await dispatch(settleWrite(Object.freeze({ ...operation, sessionKey })));
      if (result.kind === 'stale' || result.kind === 'unknown') return result;
    }

    return null;
  };

export interface Submission<T extends RequestType> {
  outcome: OperationOutcome<T>;
  memory: OperationMemory | null;
}

// The same request again reuses its operation and key. A changed one after an uncertain attempt first settles
// that attempt with its own key. When it had applied, the change is not sent: it was meant for a form that did not
// know the record, so the caller shows the record and the user saves the change again as an edit of it.
export const submitTransactionRequest =
  <T extends RequestType>(
    request: Extract<TransactionRequest, { type: T }>,
    previous: OperationMemory | null,
  ): AppThunk<Promise<Submission<T>>> =>
  async (dispatch, getState) => {
    const { sessionKey } = getState().auth;
    const { spaceId } = request;
    const isSameScope = previous?.sessionKey === sessionKey && previous.spaceId === spaceId;
    let memory: OperationMemory = isSameScope ? previous : { sessionKey, spaceId, unresolved: null };
    const pending = memory.unresolved;

    const earlier = await dispatch(settleEarlierWrites(request, pending?.operation.idempotencyKey));
    if (earlier?.kind === 'stale' || !isInScope(getState(), memory)) return { outcome: { status: 'stale' }, memory };
    if (earlier?.kind === 'unknown') {
      const failure: TransactionFailure = { kind: 'blocked', error: earlier.error };

      return { outcome: { status: 'failed', failure, operation: createOperation(request, sessionKey) }, memory };
    }

    if (pending && !isSameRequest(pending.operation, request)) {
      let { failure } = pending;

      if (failure.kind === 'uncertain') {
        const prior = await dispatch(runTransactionOperation(pending.operation));
        const record = recordOf(prior);

        if (record) return { outcome: { status: 'recovered', transaction: record }, memory: null };
        if (prior.status === 'stale' || prior.status === 'found')
          return { outcome: prior as OperationOutcome<T>, memory };

        memory = remember(memory, pending.operation, prior);

        if (prior.status === 'failed' && !isRefusal(prior.failure)) {
          return { outcome: prior as OperationOutcome<T>, memory };
        }
        if (prior.status === 'failed') failure = prior.failure;
      }

      // A create the server never got stays offered elsewhere unless this changed draft takes its place.
      if (failure.kind === 'expired') dispatch(forgetPendingWrite(pending.operation.idempotencyKey));

      memory = { ...memory, unresolved: null };
    }

    const reused = memory.unresolved && isSameRequest(memory.unresolved.operation, request) ? memory.unresolved : null;
    const operation = !reused
      ? createOperation(request, sessionKey)
      : reused.failure.kind === 'expired'
        ? renewOperation(reused.operation)
        : reused.operation;
    const outcome = await dispatch(runTransactionOperation(operation));

    if (outcome.status !== 'succeeded') {
      return { outcome: outcome as OperationOutcome<T>, memory: remember(memory, operation, outcome) };
    }

    return { outcome: outcome as OperationOutcome<T>, memory: null };
  };
