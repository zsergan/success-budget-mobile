import type { TransactionModel } from '@api/models';
import { readCategoryColor } from '@shared/categoryColors';
import type { StoredOperation } from '../transaction/operations';
import { convertCreateBody, convertUpdateBody, historicalDate } from './convert';
import type { TimestampTransactionSnapshot, TimestampWrite, WalletEraWrite } from './historical';
import type { PendingWrite, PendingWriteStatus } from './slice';

// The formats earlier builds stored pending writes in, read once and converted into the current one: builds before
// v2 (wallet era, `migrateLegacyWrites`) and builds before calendar dates (`migrateTimestampWrites`).

// An edit that only moved the record to another wallet: wallets are gone, so nothing is left to send.
export interface RetiredEdit {
  spaceId: number;
  transactionId: string;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isLegacyWrite = (value: unknown): value is WalletEraWrite => {
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
// Its instant becomes the day it had in Chicago. A write whose instant cannot be read is dropped (null).
export const fromLegacyWrite = ({ operation }: WalletEraWrite): PendingWrite | RetiredEdit | null => {
  const { idempotencyKey, firstSentAt, spaceId } = operation;

  switch (operation.type) {
    case 'create': {
      const data = convertCreateBody({
        ...withoutWallet(operation.data),
        assignment: { kind: 'space' },
        client_operation_id: idempotencyKey,
      });
      if (!data) return null;

      return {
        operation: { type: 'create', spaceId, data, idempotencyKey, firstSentAt, recovered: true },
        status: 'checking',
      };
    }
    case 'update': {
      const data = convertUpdateBody(withoutWallet(operation.data));
      const { transactionId, version } = operation;
      if (!data) return null;
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
  const converted = legacy.map(fromLegacyWrite).filter((item) => item !== null);

  return {
    writes: converted.filter((item): item is PendingWrite => !isRetiredEdit(item)),
    retiredEdits: converted.filter(isRetiredEdit),
  };
};

const STATUSES: PendingWriteStatus[] = ['sending', 'unknown', 'expired', 'checking', 'found', 'retry', 'accessLost'];

const isTimestampWrite = (value: unknown): value is TimestampWrite => {
  if (!isLegacyWrite(value) || !STATUSES.includes(value.status as PendingWriteStatus)) return false;
  const operation = value.operation as unknown as Record<string, unknown>;

  return typeof operation.firstSentAt === 'number' && (operation.type === 'delete' || isObject(operation.data));
};

// The record a create was found to have made, dated as the server now dates it; null when its instant is unreadable.
const fromSnapshot = ({ timestamp, category, ...snapshot }: TimestampTransactionSnapshot): TransactionModel | null => {
  const date = historicalDate(timestamp);

  return date === null
    ? null
    : ({ ...snapshot, date, category: { ...category, color: readCategoryColor(category.color) } } as TransactionModel);
};

// A write of a build before calendar dates, with every instant (body and found record) replaced by its Chicago day,
// and everything else kept: operation id, key, space, record, version and when it was first sent. A create is looked
// up by its operation id before it is sent again (`recovered`), so one that applied is never made twice; a found
// record that cannot be read is looked up again. Null when its body cannot be converted.
export const fromTimestampWrite = ({ operation, status, found }: TimestampWrite): PendingWrite | null => {
  const { idempotencyKey, firstSentAt, spaceId } = operation;
  const known = status as PendingWriteStatus;

  switch (operation.type) {
    case 'create': {
      const data = convertCreateBody(operation.data);
      if (!data) return null;

      const record = known === 'found' && found ? fromSnapshot(found) : null;
      const write: PendingWrite = {
        operation: { type: 'create', spaceId, data, idempotencyKey, firstSentAt, recovered: true },
        status: known === 'sending' || known === 'unknown' || (known === 'found' && !record) ? 'checking' : known,
      };

      return record ? { ...write, found: record } : write;
    }
    case 'update': {
      const data = convertUpdateBody(operation.data);
      if (!data) return null;

      const { transactionId, version } = operation;

      return {
        operation: { type: 'update', spaceId, transactionId, version, data, idempotencyKey, firstSentAt },
        status: known,
      };
    }
    case 'delete': {
      const { transactionId, version } = operation;

      return {
        operation: { type: 'delete', spaceId, transactionId, version, idempotencyKey, firstSentAt },
        status: known,
      };
    }
  }
};

// `{ version: 2, writes }` as builds before calendar dates stored it, read defensively; `isReadable` is false when the
// value is not that envelope at all, so the stored value is kept rather than taken for an empty list.
export const migrateTimestampWrites = (stored: unknown): { writes: PendingWrite[]; isReadable: boolean } => {
  if (!isObject(stored) || stored.version !== 2 || !Array.isArray(stored.writes)) {
    return { writes: [], isReadable: false };
  }

  const writes = stored.writes
    .filter(isTimestampWrite)
    .map(fromTimestampWrite)
    .filter((write) => write !== null);

  return { writes, isReadable: true };
};
