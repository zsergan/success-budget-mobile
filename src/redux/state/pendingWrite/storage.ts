import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppThunk } from '@redux/Store';
import type { RetiredEdit } from './legacy';
import { migrateLegacyWrites } from './legacy';
import type { PendingWrite } from './slice';
import { writeSettled } from './slice';

export const STORAGE_VERSION = 2;

// The format of builds before v2: a bare array of writes with v1 bodies.
export const legacyStorageKey = (userId: number) => `pendingTransactionWrites.v1.${userId}`;
export const storageKey = (userId: number) => `pendingTransactionWrites.v${STORAGE_VERSION}.${userId}`;

interface StoredWrites {
  version: typeof STORAGE_VERSION;
  writes: PendingWrite[];
}

// Writes go out one after another, so an older snapshot never lands over a newer one.
let lastWrite: Promise<unknown> = Promise.resolve();

export const persistPendingWrites = (): AppThunk<Promise<boolean>> => (_dispatch, getState) => {
  const { userId, writes } = getState().pendingWrite;
  if (userId === null) return Promise.resolve(true);

  const snapshot = JSON.stringify({ version: STORAGE_VERSION, writes } satisfies StoredWrites);
  const saved = lastWrite
    .then(() => AsyncStorage.setItem(storageKey(userId), snapshot))
    .then(
      () => true,
      () => false,
    );

  lastWrite = saved;

  return saved;
};

const parse = (text: string | null): unknown => {
  try {
    return text === null ? null : JSON.parse(text);
  } catch {
    return null;
  }
};

const readCurrent = (stored: unknown): PendingWrite[] => {
  const envelope = stored as Partial<StoredWrites> | null;

  return envelope?.version === STORAGE_VERSION && Array.isArray(envelope.writes) ? envelope.writes : [];
};

export interface RestoredWrites {
  writes: PendingWrite[];
  // Edits an older build left that only moved a record to another wallet; nothing of them can be kept.
  retiredEdits: RetiredEdit[];
}

// The user's writes, with those an older build left converted once: they join the current ones under the new key, and
// the old key goes only once that is stored, so a failed save reads them again next time.
export const readPendingWrites = async (userId: number): Promise<RestoredWrites> => {
  try {
    const [current, legacy] = await Promise.all([
      AsyncStorage.getItem(storageKey(userId)),
      AsyncStorage.getItem(legacyStorageKey(userId)),
    ]);
    const writes = readCurrent(parse(current));
    if (legacy === null) return { writes, retiredEdits: [] };

    const migrated = migrateLegacyWrites(parse(legacy));
    const keys = new Set(writes.map(({ operation }) => operation.idempotencyKey));
    const merged = [...writes, ...migrated.writes.filter(({ operation }) => !keys.has(operation.idempotencyKey))];
    const snapshot = JSON.stringify({ version: STORAGE_VERSION, writes: merged } satisfies StoredWrites);

    lastWrite = lastWrite
      .then(() => AsyncStorage.setItem(storageKey(userId), snapshot))
      .then(() => AsyncStorage.removeItem(legacyStorageKey(userId)))
      .catch(() => {});
    await lastWrite;

    return { writes: merged, retiredEdits: migrated.retiredEdits };
  } catch {
    return { writes: [], retiredEdits: [] };
  }
};

export const forgetPendingWrite =
  (key: string): AppThunk =>
  (dispatch) => {
    dispatch(writeSettled({ key, status: null }));
    void dispatch(persistPendingWrites());
  };
