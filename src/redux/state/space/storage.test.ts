import AsyncStorage from '@react-native-async-storage/async-storage';

import { createAppStore } from '@redux/Store';
import { logoutMe } from '../auth/thunks';
import { withProfile } from '../profile/fixtures';
import { readActiveSpace } from './storage';
import { activateSpace } from './thunks';

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: () => new Promise(() => {}) }),
}));
jest.mock('expo-secure-store');

jest.useFakeTimers();

const signedInAs = (userId: number) => {
  const store = createAppStore();

  withProfile(store, userId);

  return store;
};

const written = () => jest.advanceTimersByTimeAsync(0);

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('the active space of an account', () => {
  it('is saved as it is selected and read back for that account', async () => {
    const store = signedInAs(1);

    store.dispatch(activateSpace(5));
    await written();

    expect(await readActiveSpace(1)).toBe(5);
    expect(await AsyncStorage.getAllKeys()).toEqual(['activeSpace.v1.1']);
  });

  it('is kept apart from another account’s, and outlives a logout', async () => {
    const first = signedInAs(1);

    first.dispatch(activateSpace(5));
    await written();
    await first.dispatch(logoutMe());
    await written();

    const second = signedInAs(2);

    second.dispatch(activateSpace(7));
    await written();

    expect(first.getState().space.currentSpaceId).toBeNull();
    expect(await readActiveSpace(1)).toBe(5);
    expect(await readActiveSpace(2)).toBe(7);
  });

  it('is not saved while the account is unknown', async () => {
    const store = createAppStore();

    store.dispatch(activateSpace(5));
    await written();

    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });

  it('ends with the last of several quick switches, however slow the first write is', async () => {
    const store = signedInAs(1);
    const setItem = jest.spyOn(AsyncStorage, 'setItem');
    let finishFirstWrite: () => void = () => {};

    setItem.mockImplementationOnce(() => new Promise<void>((resolve) => (finishFirstWrite = resolve)));

    store.dispatch(activateSpace(5));
    store.dispatch(activateSpace(6));
    store.dispatch(activateSpace(7));
    await written();

    expect(store.getState().space.currentSpaceId).toBe(7);
    expect(setItem).toHaveBeenCalledTimes(1);

    finishFirstWrite();
    await written();

    expect(setItem.mock.calls.map(([, value]) => value)).toEqual(['5', '6', '7']);
    expect(await readActiveSpace(1)).toBe(7);
  });

  it('is forgotten when the selection becomes empty', async () => {
    const store = signedInAs(1);

    store.dispatch(activateSpace(5));
    store.dispatch(activateSpace(null));
    await written();

    expect(await readActiveSpace(1)).toBeNull();
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });

  it('switches spaces through a failed write, and saves the next selection', async () => {
    const store = signedInAs(1);

    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));

    store.dispatch(activateSpace(5));
    expect(store.getState().space.currentSpaceId).toBe(5);
    await written();
    expect(await readActiveSpace(1)).toBeNull();

    store.dispatch(activateSpace(6));
    expect(store.getState().space.currentSpaceId).toBe(6);
    await written();
    expect(await readActiveSpace(1)).toBe(6);
  });
});

describe('reading a saved space', () => {
  it.each(['', 'abc', '0', '-3', '1.5', '{"id":4}'])('takes %p for no preference', async (value) => {
    await AsyncStorage.setItem('activeSpace.v1.1', value);

    expect(await readActiveSpace(1)).toBeNull();
  });

  it('takes an unreadable storage for no preference', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage is corrupted'));

    expect(await readActiveSpace(1)).toBeNull();
  });
});
