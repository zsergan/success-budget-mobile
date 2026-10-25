import { Provider } from 'react-redux';
import { BackHandler } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { MainTabNavigationProp } from '@shared/types';
import { createAppStore } from '@redux/Store';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import { walletApi } from '@redux/state/wallet/api';
import { AppColor, ScreenNames } from '@shared/enums';
import {
  finishDismissals,
  holdDismissals,
  pressSheetBackdrop,
  resetSheets,
  swipeDownSheet,
  withSheetHost,
} from '@components/ConfirmationSheet/testing';
import WalletsSection from './WalletsSection';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');
jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const QUESTION = 'Delete “Cash”?';

const deleteRequests = () =>
  mockedRequest.mock.calls.filter(([config]: [{ method?: string }]) => config.method === 'DELETE');

const deferredDelete = () => {
  let resolve!: () => void;
  let reject!: (message: string) => void;
  const response = new Promise((res, rej) => {
    resolve = () => res({ data: undefined });
    reject = (message) => rej({ response: { status: 409, data: { message, statusCode: 409 } } });
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

  const navigate = jest.fn();
  const navigation = { navigate } as unknown as MainTabNavigationProp<ScreenNames.HOME_TAB>;

  render(
    <Provider store={store}>
      {withSheetHost(<WalletsSection navigation={navigation} onFocusedWalletChange={jest.fn()} />)}
    </Provider>,
  );

  const openMenu = () => fireEvent.press(screen.getByRole('button', { name: 'Cash options' }));
  const openConfirm = () => {
    openMenu();
    fireEvent.press(screen.getByRole('button', { name: 'Delete wallet' }));
  };

  return { store, navigate, openMenu, openConfirm };
};

const press = (label: string) => fireEvent.press(screen.getByRole('button', { name: label }));

const dismissAll = () => {
  press('Cancel');
  pressSheetBackdrop();
  swipeDownSheet();
};

beforeEach(() => {
  mockedRequest.mockReset();
  resetSheets();
});

it('sends one request for a double tap and stays open and locked until the server answers', async () => {
  const response = deferredDelete();
  const { openConfirm } = renderSection();

  openConfirm();
  press('Delete wallet');
  press('Deleting…');
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
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
  press('Delete wallet');
  await failure.reject('Wallet has transactions');

  expect(screen.getByText(QUESTION)).toBeTruthy();
  expect(screen.getByText('Wallet has transactions')).toBeTruthy();

  const retry = deferredDelete();

  press('Delete wallet');

  expect(deleteRequests()).toHaveLength(2);
  expect(screen.queryByText('Wallet has transactions')).toBeNull();

  await retry.reject('Still has transactions');
  press('Cancel');

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
  press('Delete wallet');
  await act(async () => {
    await change(store);
  });

  expect(screen.queryByText(QUESTION)).toBeNull();

  await response.reject('Wallet has transactions');

  expect(screen.queryByText('Wallet has transactions')).toBeNull();
});

it('says the wallet goes but its transactions stay, without calling it permanent', () => {
  const { openConfirm } = renderSection();
  openConfirm();

  expect(
    screen.getByText(
      'It leaves your wallets. Its transactions stay in your history and totals, marked “Deleted wallet”.',
    ),
  ).toBeTruthy();
  expect(screen.queryByText(/permanently/)).toBeNull();
});

describe('the wallet menu', () => {
  const MENU_ACTIONS = ['Edit wallet', 'Delete wallet'];
  const menuShown = () => MENU_ACTIONS.every((label) => screen.queryByRole('button', { name: label }) !== null);

  let pressBack: () => void = () => {};
  beforeEach(() => {
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
      pressBack = () => handler({} as never);
      return { remove: () => {} };
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows the wallet it is about with its actions', () => {
    const { openMenu } = renderSection();

    openMenu();

    expect(menuShown()).toBe(true);
    expect(screen.getAllByText('Cash')).toHaveLength(2);
  });

  it('opens the deletion question only once it has closed', async () => {
    const { openMenu } = renderSection();
    holdDismissals();

    openMenu();
    press('Delete wallet');

    expect(screen.queryByText(QUESTION)).toBeNull();

    await finishDismissals();

    expect(menuShown()).toBe(false);
    expect(screen.getByText(QUESTION)).toBeTruthy();
  });

  it('opens the wallet for editing only once it has closed', async () => {
    const { openMenu, navigate } = renderSection();
    holdDismissals();

    openMenu();
    press('Edit wallet');

    expect(navigate).not.toHaveBeenCalled();

    await finishDismissals();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(ScreenNames.ADD_WALLET_SCREEN, {
      id: 3,
      walletName: 'Cash',
      balance: '50',
      design: AppColor.SLATE,
    });
  });

  it.each([
    ['the backdrop', pressSheetBackdrop],
    ['a swipe', swipeDownSheet],
    ['Android Back', () => act(() => pressBack())],
  ])('closes on %s without editing or deleting', (_way, close) => {
    const { openMenu, navigate } = renderSection();

    openMenu();
    close();

    expect(menuShown()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.queryByText(QUESTION)).toBeNull();

    openMenu();

    expect(menuShown()).toBe(true);
  });

  it('leads nowhere once the space changes while it closes', async () => {
    const { store, openMenu } = renderSection();
    holdDismissals();

    openMenu();
    press('Delete wallet');
    act(() => {
      store.dispatch(activateSpace(2));
    });
    await finishDismissals();

    expect(screen.queryByText(QUESTION)).toBeNull();
  });

  it('closes on a space switch', () => {
    const { store, openMenu } = renderSection();

    openMenu();
    act(() => {
      store.dispatch(activateSpace(2));
    });

    expect(menuShown()).toBe(false);
  });
});
