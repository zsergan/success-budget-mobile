import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { withSheetHost } from '@components/ConfirmationSheet/testing';
import { withToasts } from '@components/Toast/testing';
import { createAppStore } from '@redux/Store';
import { loginMe } from '@redux/state/auth/thunks';
import { withProfile } from '@redux/state/profile/fixtures';
import { ScreenNames, SpaceType } from '@shared/enums';
import useCreateSpaceForm from './useCreateSpaceForm';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'new-key' }));
jest.mock('expo-secure-store');

jest.useFakeTimers();

const family = { name: 'Family', currency_id: 3, type: SpaceType.GROUP, invites: ['anna@example.com'] };

const renderForm = async (status: 'unknown' | 'expired') => {
  await AsyncStorage.setItem(
    'pendingSpaceCreation.v1.1',
    JSON.stringify({ idempotencyKey: 'key-1', request: family, firstSentAt: Date.now(), status }),
  );
  const store = createAppStore();
  store.dispatch(loginMe.fulfilled('token', 'login', { email: 'anna@example.com', password: 'password1' }));
  withProfile(store, 1);
  const navigation = { goBack: jest.fn(), replace: jest.fn() };
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{withSheetHost(withToasts(children))}</Provider>
  );

  const view = renderHook(() => useCreateSpaceForm({ navigation } as never), { wrapper: Wrapper });

  await waitFor(() => expect(view.result.current.pendingNotice).toBeTruthy());

  return { ...view, navigation };
};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockedRequest.mockImplementation(async ({ method }: { method: string }) => ({
    data: method === 'POST' ? { id: 41, name: 'Family', type: SpaceType.GROUP } : [],
  }));
});

describe('an unanswered space creation from an earlier run', () => {
  it('comes back in the form and is sent again with its own key', async () => {
    const { result, navigation } = await renderForm('unknown');

    expect(result.current.pendingNotice).toMatch("won't be made twice");

    await act(async () => {
      await result.current.onSubmit();
    });

    const posts = mockedRequest.mock.calls.map(([config]) => config).filter(({ method }) => method === 'POST');
    expect(posts).toEqual([
      expect.objectContaining({ url: '/spaces', data: family, headers: { 'Idempotency-Key': 'key-1' } }),
    ]);
    expect(navigation.replace).toHaveBeenCalledWith(ScreenNames.MEMBERS_SCREEN);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('warns that one past the key lifetime may already exist, and creates it anyway under a new key', async () => {
    const { result } = await renderForm('expired');

    expect(result.current.pendingNotice).toMatch('may already exist');

    await act(async () => {
      await result.current.onSubmit();
    });

    const posts = mockedRequest.mock.calls.map(([config]) => config).filter(({ method }) => method === 'POST');
    expect(posts).toEqual([expect.objectContaining({ headers: { 'Idempotency-Key': 'new-key' } })]);
  });
});
