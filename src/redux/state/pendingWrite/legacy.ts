import type { CreateTransactionRequest, UpdateTransactionRequest } from '@api/dto';
import type { StoredOperation } from '../transaction/operations';
import type { PendingWrite } from './slice';

// What builds before v2 stored: v1 bodies, a create's naming its wallet.
type LegacyBody = Omit<CreateTransactionRequest, 'assignment'> & { wallet_id?: number };

export type LegacyOperation = { idempotencyKey: string; firstSentAt: number; spaceId: number } & (
  | { type: 'create'; data: LegacyBody }
  | { type: 'update'; transactionId: string; version: number; data: Partial<LegacyBody> }
  | { type: 'delete'; transactionId: string; version: number }
);

export interface LegacyWrite {
  operation: LegacyOperation;
  status: string;
}

// An edit that only moved the record to another wallet: wallets are gone, so nothing is left to send.
export interface RetiredEdit {
  spaceId: number;
  transactionId: string;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isLegacyWrite = (value: unknown): value is LegacyWrite => {
  if (!isObject(value) || !isObject(value.operation)) return false;
  const { type, spaceId, idempotencyKey } = value.operation;

  return (
    (type === 'create' || type === 'update' || type === 'delete') &&
    typeof spaceId === 'number' &&
    typeof idempotencyKey === 'string'
  );
};

const withoutWallet = <T extends { wallet_id?: number }>({ wallet_id: _walletId, ...rest }: T) => rest;

// A create is kept with the body the converted v2 create would send: the same operation id, assigned to the whole
// space, as the old body could not say whom it was for. It is looked up before anything is sent (`checking`).
// An edit or a delete goes out again through v2 at its version, with its own key; the wallet part of an edit is dropped.
export const fromLegacyWrite = ({ operation }: LegacyWrite): PendingWrite | RetiredEdit => {
  const { idempotencyKey, firstSentAt, spaceId } = operation;

  switch (operation.type) {
    case 'create': {
      const data: CreateTransactionRequest = {
        ...withoutWallet(operation.data),
        assignment: { kind: 'space' },
        client_operation_id: idempotencyKey,
      };

      return { operation: { type: 'create', spaceId, data, idempotencyKey, firstSentAt }, status: 'checking' };
    }
    case 'update': {
      const data: UpdateTransactionRequest = withoutWallet(operation.data);
      const { transactionId, version } = operation;
      if (Object.keys(data).length === 0) return { spaceId, transactionId };

      const stored: StoredOperation = {
        type: 'update',
        spaceId,
        transactionId,
        version,
        data,
        idempotencyKey,
        firstSentAt,
      };

      return { operation: stored, status: 'unknown' };
    }
    case 'delete': {
      const { transactionId, version } = operation;

      return {
        operation: { type: 'delete', spaceId, transactionId, version, idempotencyKey, firstSentAt },
        status: 'unknown',
      };
    }
  }
};

export const isRetiredEdit = (value: PendingWrite | RetiredEdit): value is RetiredEdit => !('operation' in value);

// Whatever the old build left, read defensively: anything that is not a write it could have stored is dropped.
export const migrateLegacyWrites = (stored: unknown) => {
  const legacy = Array.isArray(stored) ? stored.filter(isLegacyWrite) : [];
  const converted = legacy.map(fromLegacyWrite);

  return {
    writes: converted.filter((item): item is PendingWrite => !isRetiredEdit(item)),
    retiredEdits: converted.filter(isRetiredEdit),
  };
};
