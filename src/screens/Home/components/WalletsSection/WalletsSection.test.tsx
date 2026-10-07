import { Modal } from 'react-native';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

import type { MainTabNavigationProp } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import { createAppStore } from '@redux/Store';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import { walletApi } from '@redux/state/wallet/api';
import { AppColor } from '@shared/enums';
import WalletsSection from './WalletsSection';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const QUESTION = 'Delete a Cash permanently?';

const deleteRequests = () =>
  mockedRequest.mock.calls.filter(([config]: [{ method?: string }]) => config.method === 'DELETE');

const deferredDelete = () => {
  let resolve!: () => void;
  let reject!: (message: string) => void;
  const response = new Promise((res, rej) => {
    resolve = () => res({ data: undefined });
    reject = (message) => rej({ response: { data: { message, statusCode: 409 } } });
  });

  mockedRequest.mockImplementation((config: { method?: string }) =>
    config.method === 'DELETE' ? response : new Promise(() => {}),
  );

  return { resolve: () => act(async () => resolve()), reject: (message: string) => act(async () => reject(message)) };
};

const renderSection = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(1));
  store.dispatch(
    walletApi.util.upsertQueryEntries([
      {
        endpointName: 'getWallets',
        arg: { spaceId: 1 },
        value: {
          total_balance: 50,
          total_balance_currency: 'USD',
          delta_percent: 0,
          wallets: [
            {
              wallet: { id: 3, wallet_name: 'Cash', design: AppColor.SLATE, balance: 50 },
              total_spend: 0,
              total_income: 50,
            },
          ],
        },
      },
    ]),
  );

  const navigation = { navigate: jest.fn() } as unknown as MainTabNavigationProp<ScreenNames.HOME_TAB>;

  render(
    <Provider store={store}>
      <WalletsSection navigation={navigation} onFocusedWalletChange={jest.fn()} />
    </Provider>,
  );

  const openConfirm = () => {
    fireEvent.press(screen.getByRole('button', { name: 'Cash options' }));
    fireEvent.press(screen.getByText('Delete'));
  };

  return { store, openConfirm };
};

const confirmModal = () => within(screen.UNSAFE_getAllByType(Modal).find((modal) => modal.props.visible)!);

// The backdrop and Android back both go through ModalContainer's onClose.
const dismissAll = () => {
  const modal = screen.UNSAFE_getAllByType(Modal).find(({ props }) => props.visible)!;

  fireEvent.press(confirmModal().getByText('Cancel'));
  fireEvent.press(screen.UNSAFE_getAllByProps({ onPress: modal.props.onRequestClose })[0]);
  act(() => modal.props.onRequestClose());
};

beforeEach(() => mockedRequest.mockReset());

it('sends one request for a double tap and stays open and locked until the server answers', async () => {
  const response = deferredDelete();
  const { openConfirm } = renderSection();

  openConfirm();
  fireEvent.press(confirmModal().getByText('Delete'));
  fireEvent.press(confirmModal().getByText('Deleting…'));
  dismissAll();

  expect(deleteRequests()).toHaveLength(1);
  expect(deleteRequests()[0][0]).toEqual(expect.objectContaining({ url: '/spaces/1/wallets/3' }));
  expect(screen.getByText(QUESTION)).toBeTruthy();

  await response.resolve();

  expect(screen.queryByText(QUESTION)).toBeNull();
});

it('shows a failure inside the dialog, allows a retry, and forgets it on reopening', async () => {
  const failure = deferredDelete();
  const { openConfirm } = renderSection();

  openConfirm();
  fireEvent.press(confirmModal().getByText('Delete'));
  await failure.reject('Wallet has transactions');

  expect(screen.getByText(QUESTION)).toBeTruthy();
  expect(screen.getByText('Wallet has transactions')).toBeTruthy();

  const retry = deferredDelete();

  fireEvent.press(confirmModal().getByText('Delete'));

  expect(deleteRequests()).toHaveLength(2);
  expect(screen.queryByText('Wallet has transactions')).toBeNull();

  await retry.reject('Still has transactions');
  fireEvent.press(confirmModal().getByText('Cancel'));

  expect(screen.queryByText(QUESTION)).toBeNull();

  openConfirm();

  expect(screen.getByText(QUESTION)).toBeTruthy();
  expect(screen.queryByText('Still has transactions')).toBeNull();
});

it.each([
  ['a space switch', (store: ReturnType<typeof createAppStore>) => store.dispatch(activateSpace(2))],
  [
    'a logout and a new login',
    async (store: ReturnType<typeof createAppStore>) => {
      await store.dispatch(logoutMe());
      store.dispatch(loginMe.fulfilled('token-2', 'req-login-2', { email: 'a@b.com', password: 'password1' }));
      store.dispatch(activateSpace(1));
    },
  ],
])('closes a locked dialog on %s and ignores its late failure', async (_change, change) => {
  const response = deferredDelete();
  const { store, openConfirm } = renderSection();

  openConfirm();
  fireEvent.press(confirmModal().getByText('Delete'));
  await act(async () => {
    await change(store);
  });

  expect(screen.queryByText(QUESTION)).toBeNull();

  await response.reject('Wallet has transactions');

  expect(screen.queryByText('Wallet has transactions')).toBeNull();
});
