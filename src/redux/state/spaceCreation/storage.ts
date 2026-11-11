import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppThunk } from '@redux/Store';
import type { SpaceCreationAttempt } from './slice';

const storageKey = (userId: number) => `pendingSpaceCreation.v1.${userId}`;

// Writes go out one after another, so an older snapshot never lands over a newer one.
let lastWrite: Promise<unknown> = Promise.resolve();

export const persistSpaceCreation = (): AppThunk<Promise<boolean>> => (_dispatch, getState) => {
  const { userId, attempt } = getState().spaceCreation;
  if (userId === null) return Promise.resolve(true);

  const key = storageKey(userId);
  const snapshot = attempt && JSON.stringify(attempt);
  const saved = lastWrite
    .then(() => (snapshot ? AsyncStorage.setItem(key, snapshot) : AsyncStorage.removeItem(key)))
    .then(
      () => true,
      () => false,
    );

  lastWrite = saved;

  return saved;
};

const isAttempt = (value: unknown): value is SpaceCreationAttempt => {
  const attempt = value as Partial<SpaceCreationAttempt> | null;

  return (
    typeof attempt?.idempotencyKey === 'string' &&
    typeof attempt.firstSentAt === 'number' &&
    typeof attempt.request === 'object' &&
    attempt.request !== null
  );
};

export const readSpaceCreation = async (userId: number): Promise<SpaceCreationAttempt | null> => {
  try {
    const stored: unknown = JSON.parse((await AsyncStorage.getItem(storageKey(userId))) ?? 'null');

    return isAttempt(stored) ? stored : null;
  } catch {
    return null;
  }
};
