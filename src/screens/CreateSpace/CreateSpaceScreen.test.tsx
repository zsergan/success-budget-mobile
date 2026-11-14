import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { withSheetHost } from '@components/ConfirmationSheet/testing';
import { withToasts } from '@components/Toast/testing';
import { createAppStore } from '@redux/Store';
import { loginMe } from '@redux/state/auth/thunks';
import { withProfile } from '@redux/state/profile/fixtures';
import { ScreenNames, SpaceType } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import CreateSpaceScreen from './CreateSpaceScreen';

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
jest.mock('expo-crypto', () => ({ randomUUID: () => 'new-key' }));
jest.mock('expo-secure-store');

jest.useFakeTimers();

const CURRENCIES = [
  { id: 7, code: 'USD', name: 'US dollar' },
  { id: 9, code: 'EUR', name: 'Euro' },
];

const metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

interface Request {
  url: string;
  method: string;
  data?: unknown;
}

const answer = (currencies: () => Promise<unknown> = async () => ({ data: CURRENCIES })) =>
  mockedRequest.mockImplementation(async ({ url, method }: Request) => {
    if (url === '/currencies') return currencies();

    return { data: method === 'POST' ? { id: 41, name: 'Family', type: SpaceType.GROUP } : [] };
  });

const created = () =>
  mockedRequest.mock.calls
    .map(([config]: [Request]) => config)
    .filter(({ method }) => method === 'POST')
    .map(({ data }) => data);

const renderCreateSpace = async () => {
  const store = createAppStore();
  store.dispatch(loginMe.fulfilled('token', 'login', { email: 'anna@example.com', password: 'password1' }));
  withProfile(store, 1);
  const navigation = { goBack: jest.fn(), replace: jest.fn() };

  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Provider store={store}>
        {withSheetHost(
          withToasts(
            <CreateSpaceScreen
              {...({ navigation, route: {} } as unknown as RootStackScreenProps<ScreenNames.CREATE_SPACE_SCREEN>)}
            />,
          ),
        )}
      </Provider>
    </SafeAreaProvider>,
  );
  await act(async () => {});

  return { navigation };
};

const currencyField = () => screen.getByRole('button', { name: 'Currency' });

const fillIn = async (name: string) => {
  fireEvent.changeText(screen.getByLabelText('Space name'), name);
  fireEvent.press(currencyField());
  await act(async () => screen.UNSAFE_getByType(Picker).props.onValueChange(7, 0));
};

const invite = (email: string) => {
  const field = screen.getByPlaceholderText('name@email.com');

  fireEvent.changeText(field, email);
  fireEvent(field, 'submitEditing');
};

const submit = (title: string) => act(async () => void fireEvent.press(screen.getByText(title)));

beforeEach(() => {
  jest.clearAllMocks();
  answer();
});

describe('the currency', () => {
  it('is picked by code and name, with the reminder that it is set once', async () => {
    await renderCreateSpace();
    await fillIn('Family');

    expect(currencyField().props.accessibilityValue).toEqual({ text: 'USD · US dollar' });
    expect(screen.getByText('Chosen once, at creation — it cannot be changed later.')).toBeTruthy();
  });

  it('waits for the list, and offers a retry that keeps the name when it fails', async () => {
    answer(() => Promise.reject({ code: 'ERR_NETWORK', message: 'Network Error' }));
    await renderCreateSpace();
    fireEvent.changeText(screen.getByLabelText('Space name'), 'Family');

    expect(await screen.findByText('Couldn’t load the currencies.')).toBeTruthy();

    answer();
    await act(async () => void fireEvent.press(screen.getByRole('button', { name: 'Load the currencies again' })));

    await waitFor(() => expect(screen.queryByText('Couldn’t load the currencies.')).toBeNull());
    expect(currencyField().props.accessibilityState).toMatchObject({ disabled: false });
    expect(screen.getByLabelText('Space name').props.value).toBe('Family');
  });
});

describe('creating', () => {
  it('creates a personal space and goes back', async () => {
    const { navigation } = await renderCreateSpace();
    fireEvent.press(screen.getByText('Personal'));
    await fillIn('Savings');

    await submit('Create space');

    expect(created()).toEqual([{ name: 'Savings', currency_id: 7, type: SpaceType.PERSONAL }]);
    expect(navigation.goBack).toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('creates a group without invitations under Create space and goes back', async () => {
    const { navigation } = await renderCreateSpace();
    await fillIn('Family');

    expect(screen.queryByText('Create and invite')).toBeNull();
    await submit('Create space');

    expect(created()).toEqual([{ name: 'Family', currency_id: 7, type: SpaceType.GROUP }]);
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('says Create and invite once an address is added, and opens Members after sending it', async () => {
    const { navigation } = await renderCreateSpace();
    await fillIn('Family');
    invite('ben@example.com');

    expect(screen.queryByText('Create space')).toBeNull();
    await submit('Create and invite');

    expect(created()).toEqual([
      { name: 'Family', currency_id: 7, type: SpaceType.GROUP, invites: ['ben@example.com'] },
    ]);
    expect(navigation.replace).toHaveBeenCalledWith(ScreenNames.MEMBERS_SCREEN);
  });

  it('drops the invitations from a space turned personal', async () => {
    await renderCreateSpace();
    await fillIn('Family');
    invite('ben@example.com');

    fireEvent.press(screen.getByText('Personal'));

    expect(screen.getByText('Create space')).toBeTruthy();
    expect(screen.queryByText('Create and invite')).toBeNull();
  });

  it('names what is missing and sends nothing', async () => {
    await renderCreateSpace();

    await submit('Create space');

    expect(screen.getByText('Enter a space name')).toBeTruthy();
    expect(screen.getByText('Choose a currency')).toBeTruthy();
    expect(created()).toEqual([]);
  });
});
