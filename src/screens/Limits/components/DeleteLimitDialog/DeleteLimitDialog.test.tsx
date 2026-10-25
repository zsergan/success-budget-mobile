import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { LimitModel } from '@api/models';
import type { ConfirmAction } from '@hooks';
import useConfirmAction from '@hooks/useConfirmAction';
import { createAppStore } from '@redux/Store';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import { pressSheetBackdrop, resetSheets, swipeDownSheet, withSheetHost } from '@components/ConfirmationSheet/testing';
import { AppColor } from '@shared/enums';
import DeleteLimitDialog from './DeleteLimitDialog';

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

const LIMIT: LimitModel = { id: 5, name: 'Food', amount: '100', spent: 40, inPercent: 40, categories: [] };
const TITLE = 'Delete the “Food” limit?';

const deferredResponse = () => {
  let resolve!: () => void;
  let reject!: (message: string) => void;

  mockedRequest.mockReturnValueOnce(
    new Promise((res, rej) => {
      resolve = () => res({ data: undefined });
      reject = (message) => rej({ response: { status: 409, data: { message, statusCode: 409 } } });
    }),
  );

  return { resolve: () => act(async () => resolve()), reject: (message: string) => act(async () => reject(message)) };
};

const renderDialog = (limit: LimitModel = LIMIT) => {
  const store = createAppStore();
  const deletion = { current: undefined as unknown as ConfirmAction<LimitModel> };

  store.dispatch(activateSpace(1));

  const Harness = () => {
    deletion.current = useConfirmAction<LimitModel>();

    return <DeleteLimitDialog deletion={deletion.current} currencyCode="USD" />;
  };

  render(<Provider store={store}>{withSheetHost(<Harness />)}</Provider>);

  const open = () => act(() => deletion.current.open(limit));

  return { store, open };
};

const dismissAll = () => {
  fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  pressSheetBackdrop();
  swipeDownSheet();
};

beforeEach(() => {
  jest.clearAllMocks();
  resetSheets();
});

it('sends one request for a double tap and stays open and locked until the server answers', async () => {
  const response = deferredResponse();
  const { open } = renderDialog();

  open();
  fireEvent.press(screen.getByText('Delete limit'));
  fireEvent.press(screen.getByText('Deleting…'));
  dismissAll();

  expect(mockedRequest).toHaveBeenCalledTimes(1);
  expect(mockedRequest).toHaveBeenCalledWith(expect.objectContaining({ url: '/spaces/1/limits/5', method: 'DELETE' }));
  expect(screen.getByText(TITLE)).toBeTruthy();

  await response.resolve();

  expect(screen.queryByText(TITLE)).toBeNull();
});

it('shows a failure inside the dialog, allows a retry, and forgets it on reopening', async () => {
  const failure = deferredResponse();
  const { open } = renderDialog();

  open();
  fireEvent.press(screen.getByText('Delete limit'));
  await failure.reject('Limit is locked');

  expect(screen.getByText(TITLE)).toBeTruthy();
  expect(screen.getByText('Limit is locked')).toBeTruthy();

  const retry = deferredResponse();

  fireEvent.press(screen.getByText('Delete limit'));

  expect(mockedRequest).toHaveBeenCalledTimes(2);
  expect(screen.queryByText('Limit is locked')).toBeNull();

  await retry.reject('Still locked');
  fireEvent.press(screen.getByText('Cancel'));

  expect(screen.queryByText(TITLE)).toBeNull();

  open();

  expect(screen.queryByText('Still locked')).toBeNull();
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
  const response = deferredResponse();
  const { store, open } = renderDialog();

  open();
  fireEvent.press(screen.getByText('Delete limit'));
  await act(async () => {
    await change(store);
  });

  expect(screen.queryByText(TITLE)).toBeNull();

  await response.reject('Limit is locked');

  expect(screen.queryByText('Limit is locked')).toBeNull();
});

it('names the limit and its spending, and says its transactions stay', () => {
  const { open } = renderDialog({
    ...LIMIT,
    name: 'Fun',
    categories: [
      { id: 1, name: 'Cafe', icon: 'cafe', color: AppColor.CLAY },
      { id: 2, name: 'Cinema', icon: 'entertainment', color: AppColor.PLUM },
    ],
  });
  open();

  expect(screen.getByRole('header', { name: 'Delete the “Fun” limit?' })).toBeTruthy();
  expect(
    screen.getByText(
      'Only the threshold goes away. Your transactions in Cafe, Cinema stay untouched and keep counting towards the monthly total.',
    ),
  ).toBeTruthy();
  expect(screen.getByText(/ of .* this month$/)).toBeTruthy();
});

it('names the monthly total limit, whose expenses keep being recorded', () => {
  const { open } = renderDialog({ ...LIMIT, name: null });
  open();

  expect(screen.getByRole('header', { name: 'Delete the monthly total limit?' })).toBeTruthy();
  expect(
    screen.getByText('Only the threshold goes away. Every expense keeps being recorded exactly as before.'),
  ).toBeTruthy();
});
