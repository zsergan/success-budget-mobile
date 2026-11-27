import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { Space } from '@api/dto';
import { withSheetHost } from '@components/ConfirmationSheet/testing';
import { withToasts } from '@components/Toast/testing';
import { createAppStore } from '@redux/Store';
import { loginMe } from '@redux/state/auth/thunks';
import { spaceSelected } from '@redux/state/space/thunks';
import { SpaceType } from '@shared/enums';
import SpaceCurrencyRow from './SpaceCurrencyRow';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

jest.useFakeTimers();

const USD = { id: 7, code: 'USD', name: 'US dollar' };
const EUR = { id: 9, code: 'EUR', name: 'Euro' };

const space = (role: Space['role']): Space => ({
  id: 3,
  name: 'Family',
  type: SpaceType.GROUP,
  currency: USD,
  created_at: '2026-01-01T00:00:00.000Z',
  role,
  member_count: 2,
});

const metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

const patches = () =>
  mockedRequest.mock.calls.map(([config]) => config).filter(({ method }: { method: string }) => method === 'PATCH');

const renderRow = async (role: Space['role']) => {
  mockedRequest.mockImplementation(async ({ url, method }: { url: string; method: string }) => {
    if (url === '/currencies') return { data: [USD, EUR] };
    if (method === 'PATCH') return { data: { ...space(role), currency: EUR } };

    return { data: [] };
  });
  const store = createAppStore();
  store.dispatch(loginMe.fulfilled('token', 'login', { email: 'anna@example.com', password: 'password1' }));
  store.dispatch(spaceSelected(3));

  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Provider store={store}>{withSheetHost(withToasts(<SpaceCurrencyRow space={space(role)} />))}</Provider>
    </SafeAreaProvider>,
  );
  await act(async () => {});
};

beforeEach(() => jest.clearAllMocks());

it('shows the currency by its symbol and code', async () => {
  await renderRow('owner');

  expect(screen.getByText('$ USD')).toBeTruthy();
  expect(screen.getByText('Shown on every amount; nothing is converted')).toBeTruthy();
});

it('lets the owner pick another currency and change it once confirmed', async () => {
  await renderRow('owner');

  await act(async () => void fireEvent.press(screen.getByText('Space currency')));
  await act(async () => void fireEvent.press(screen.getByRole('button', { name: 'Euro, EUR' })));

  expect(await screen.findByText('Show amounts in Euro?')).toBeTruthy();
  expect(patches()).toEqual([]);

  await act(async () => void fireEvent.press(screen.getByText('Change currency')));

  expect(patches()).toEqual([expect.objectContaining({ url: '/spaces/3/currency', data: { currency_id: 9 } })]);
});

it('changes nothing when the owner picks the current currency again', async () => {
  await renderRow('owner');

  await act(async () => void fireEvent.press(screen.getByText('Space currency')));
  await act(async () => void fireEvent.press(screen.getByRole('button', { name: 'US dollar, USD' })));

  expect(screen.queryByText('Show amounts in US dollar?')).toBeNull();
  expect(patches()).toEqual([]);
});

it('tells a member that only the owner can change it, and opens nothing', async () => {
  await renderRow('member');

  expect(screen.getByText('Only the owner can change it')).toBeTruthy();
  await act(async () => void fireEvent.press(screen.getByText('Space currency')));

  expect(screen.queryByRole('button', { name: 'Euro, EUR' })).toBeNull();
});
