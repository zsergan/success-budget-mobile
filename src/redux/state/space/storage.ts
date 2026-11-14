import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (userId: number) => `activeSpace.v1.${userId}`;

// Writes of one account go out one after another, so an older selection never lands over a newer one.
const lastWrites = new Map<number, Promise<boolean>>();

export const persistActiveSpace = (userId: number, spaceId: number | null): Promise<boolean> => {
  const key = storageKey(userId);
  const saved = (lastWrites.get(userId) ?? Promise.resolve(true))
    .then(() => (spaceId === null ? AsyncStorage.removeItem(key) : AsyncStorage.setItem(key, String(spaceId))))
    .then(
      () => true,
      () => false,
    );

  lastWrites.set(userId, saved);

  return saved;
};

// The preference is optional: a launch waits this long for it, then opens the fallback space.
export const ACTIVE_SPACE_READ_TIMEOUT_MS = 1000;

// null for a missing, malformed, unreadable or slow value; a read that answers after the wait is ignored.
export const readActiveSpace = async (userId: number): Promise<number | null> => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const stored = await Promise.race([
      AsyncStorage.getItem(storageKey(userId)),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ACTIVE_SPACE_READ_TIMEOUT_MS);
      }),
    ]);

    return stored !== null && /^[1-9]\d*$/.test(stored) ? Number(stored) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};
