import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppThunk } from '@redux/Store';
import type { RetiredEdit } from './legacy';
import { migrateLegacyWrites, migrateTimestampWrites } from './legacy';
import type { PendingWrite } from './slice';
import { writeSettled } from './slice';

export const STORAGE_VERSION = 3;

// Earlier formats: a bare array of v1 bodies (before v2), then `{ version: 2, writes }` with instants (before
// calendar dates).
export const legacyStorageKey = (userId: number) => `pendingTransactionWrites.v1.${userId}`;
export const timestampStorageKey = (userId: number) => `pendingTransactionWrites.v2.${userId}`;
export const storageKey = (userId: number) => `pendingTransactionWrites.v${STORAGE_VERSION}.${userId}`;

interface StoredWrites {
  version: typeof STORAGE_VERSION;
  writes: PendingWrite[];
}

// Writes go out one after another, so an older snapshot never lands over a newer one.
let lastWrite: Promise<unknown> = Promise.resolve();

// Per user, the keys of earlier formats whose writes are now in the state. A key goes only once a save made from
// that state has been stored, so a failed save, or a save of a state from before, leaves it to be read again.
const carriedOver = new Map<number, string[]>();

export const carryOver = (userId: number, sources: string[]) => {
  if (sources.length > 0) carriedOver.set(userId, sources);
};

export const persistPendingWrites = (): AppThunk<Promise<boolean>> => (_dispatch, getState) => {
  const { userId, writes } = getState().pendingWrite;
  if (userId === null) return Promise.resolve(true);

  const sources = carriedOver.get(userId);
  const snapshot = JSON.stringify({ version: STORAGE_VERSION, writes } satisfies StoredWrites);
  const saved = lastWrite
    .then(() => AsyncStorage.setItem(storageKey(userId), snapshot))
    .then(async () => {
      if (!sources) return;

      await Promise.all(sources.map((key) => AsyncStorage.removeItem(key)));
      if (carriedOver.get(userId) === sources) carriedOver.delete(userId);
    })
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
    return undefined;
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
  // The keys of earlier formats the writes were converted from, to remove once they are stored in the current one.
  sources: string[];
}

// The user's writes, with those of earlier formats converted: they join the current ones, a write already there
// winning. Nothing is stored or removed here; a stored value that cannot be read at all is never a source.
export const readPendingWrites = async (userId: number): Promise<RestoredWrites> => {
  try {
    const [current, timestamped, legacy] = await Promise.all([
      AsyncStorage.getItem(storageKey(userId)),
      AsyncStorage.getItem(timestampStorageKey(userId)),
      AsyncStorage.getItem(legacyStorageKey(userId)),
    ]);
    const writes = readCurrent(parse(current));
    if (timestamped === null && legacy === null) return { writes, retiredEdits: [], sources: [] };

    const fromTimestamped = timestamped === null ? null : migrateTimestampWrites(parse(timestamped));
    const legacyValue = legacy === null ? undefined : parse(legacy);
    const fromLegacy = legacy === null ? null : migrateLegacyWrites(legacyValue);
    const keys = new Set(writes.map(({ operation }) => operation.idempotencyKey));
    const merged = [...writes];

    [...(fromTimestamped?.writes ?? []), ...(fromLegacy?.writes ?? [])].forEach((write) => {
      if (keys.has(write.operation.idempotencyKey)) return;

      keys.add(write.operation.idempotencyKey);
      merged.push(write);
    });

    const sources = [
      ...(fromTimestamped?.isReadable ? [timestampStorageKey(userId)] : []),
      ...(fromLegacy && Array.isArray(legacyValue) ? [legacyStorageKey(userId)] : []),
    ];

    return { writes: merged, retiredEdits: fromLegacy?.retiredEdits ?? [], sources };
  } catch {
    return { writes: [], retiredEdits: [], sources: [] };
  }
};

export const forgetPendingWrite =
  (key: string): AppThunk =>
  (dispatch) => {
    dispatch(writeSettled({ key, status: null }));
    void dispatch(persistPendingWrites());
  };
