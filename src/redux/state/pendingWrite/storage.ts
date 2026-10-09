import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppThunk } from '@redux/Store';
import type { PendingWrite } from './slice';
import { writeSettled } from './slice';

const storageKey = (userId: number) => `pendingTransactionWrites.v1.${userId}`;

// Writes go out one after another, so an older snapshot never lands over a newer one.
let lastWrite: Promise<unknown> = Promise.resolve();

export const persistPendingWrites = (): AppThunk<Promise<boolean>> => (_dispatch, getState) => {
  const { userId, writes } = getState().pendingWrite;
  if (userId === null) return Promise.resolve(true);

  const snapshot = JSON.stringify(writes);
  const saved = lastWrite
    .then(() => AsyncStorage.setItem(storageKey(userId), snapshot))
    .then(
      () => true,
      () => false,
    );

  lastWrite = saved;

  return saved;
};

export const readPendingWrites = async (userId: number): Promise<PendingWrite[]> => {
  try {
    const stored = JSON.parse((await AsyncStorage.getItem(storageKey(userId))) ?? '[]');

    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

export const forgetPendingWrite =
  (key: string): AppThunk =>
  (dispatch) => {
    dispatch(writeSettled({ key, status: null }));
    void dispatch(persistPendingWrites());
  };
