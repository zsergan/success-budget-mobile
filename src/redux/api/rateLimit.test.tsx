import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { View } from 'react-native';
import { Provider } from 'react-redux';
import { act, render, screen } from '@testing-library/react-native';

import { bindHttpSession } from '@api/session';
import { withSheetHost } from '@components/ConfirmationSheet/testing';
import { toastCount, withToasts } from '@components/Toast/testing';
import { memberApi } from '@redux/state/member/api';
import { walletApi } from '@redux/state/wallet/api';
import { createAppStore } from '@redux/Store';
import { RATE_LIMITED_MESSAGE } from '@shared/utils/error';

// Only the transport is replaced: the shared client's interceptors, the base query and the toast are the app's own.
const mockRespond = jest.fn<Promise<AxiosResponse>, [AxiosRequestConfig]>();
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  actual.default.defaults.adapter = (config: AxiosRequestConfig) => mockRespond(config);
  return actual;
});
jest.mock('expo-secure-store');

jest.useFakeTimers();

const tooManyRequests = (config: AxiosRequestConfig) => {
  const { AxiosError } = jest.requireActual('axios');
  const response = {
    status: 429,
    statusText: '',
    headers: {},
    config,
    data: { statusCode: 429, message: 'Slow down' },
  };

  return Promise.reject(
    new AxiosError('Request failed with status code 429', 'ERR_BAD_REQUEST', config, null, response),
  );
};

const renderApp = () => {
  const store = createAppStore();
  bindHttpSession({ getKey: () => store.getState().auth.sessionKey, end: jest.fn(), isLaunching: () => false });
  render(<Provider store={store}>{withSheetHost(withToasts(<View />))}</Provider>);

  return store;
};

beforeEach(() => mockRespond.mockImplementation(tooManyRequests));

afterAll(() => bindHttpSession(null));

it('leaves a write’s 429 to the place that asked for it, the invite cooldown included', async () => {
  const store = renderApp();

  await act(async () => {
    await store.dispatch(walletApi.endpoints.deleteWallet.initiate({ spaceId: 1, walletId: 3 }));
    await store.dispatch(memberApi.endpoints.inviteMember.initiate({ spaceId: 1, email: 'a@b.co' }));
  });

  expect(mockRespond).toHaveBeenCalledTimes(2);
  expect(store.getState().member.inviteCooldownUntil).toEqual(expect.any(Number));
  expect(toastCount()).toBe(0);
});

it('explains a read nothing on screen explains with one generic error and no Retry', async () => {
  const store = renderApp();

  await act(async () => {
    await Promise.all([
      store.dispatch(walletApi.endpoints.getWallets.initiate({ spaceId: 1 }, { subscribe: false })),
      store.dispatch(memberApi.endpoints.getMembers.initiate({ spaceId: 1 }, { subscribe: false })),
    ]);
  });

  expect(toastCount()).toBe(1);
  expect(screen.getByText(RATE_LIMITED_MESSAGE)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
});
