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

export const readActiveSpace = async (userId: number): Promise<number | null> => {
  try {
    const stored = await AsyncStorage.getItem(storageKey(userId));

    return stored !== null && /^[1-9]\d*$/.test(stored) ? Number(stored) : null;
  } catch {
    return null;
  }
};
