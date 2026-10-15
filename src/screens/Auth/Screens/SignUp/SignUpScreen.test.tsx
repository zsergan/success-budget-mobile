import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { register } from '@api/auth.api';
import { createAppStore } from '@redux/Store';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import SignUpScreen from './SignUpScreen';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('expo-secure-store');

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('@api/auth.api', () => ({
  ...jest.requireActual('@api/auth.api'),
  register: jest.fn(),
}));
jest.mock('@hooks', () => ({
  useAlert: () => ({ addAlert: jest.fn() }),
}));

const mockedRegister = jest.mocked(register);

const CURRENCIES = [
  { id: 7, code: 'USD', name: 'US dollar' },
  { id: 9, code: 'EUR', name: 'Euro' },
];

const metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

const answerCurrencies = () => mockedRequest.mockResolvedValue({ data: CURRENCIES });

const failCurrencies = () => mockedRequest.mockRejectedValue({ code: 'ERR_NETWORK', message: 'Network Error' });

const renderSignUp = async () => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };

  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Provider store={createAppStore()}>
        <SignUpScreen {...({ navigation, route: {} } as unknown as RootStackScreenProps<ScreenNames.SIGN_UP_SCREEN>)} />
      </Provider>
    </SafeAreaProvider>,
  );
  await act(async () => {});

  return { navigation };
};

const pickCurrency = async (id: number) => {
  fireEvent.press(screen.getByRole('button', { name: 'Currency of your space' }));
  await act(async () => screen.UNSAFE_getByType(Picker).props.onValueChange(id, 0));
};

beforeEach(() => jest.clearAllMocks());

it('lays the fields out one per row, in the design’s order', async () => {
  answerCurrencies();
  await renderSignUp();

  const labels = ['Name', 'Email', 'Password', 'Confirm password', 'Currency of your space'];
  const positions = labels.map((label) => JSON.stringify(screen.toJSON()).indexOf(`"${label}"`));

  expect(positions.every((position) => position >= 0)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  expect(screen.getByText('At least 8 characters, with a letter and a digit.')).toBeTruthy();
  expect(screen.getByText('Set once. Every amount in this space is kept in it.')).toBeTruthy();
});

it('reveals each password on its own', async () => {
  answerCurrencies();
  await renderSignUp();

  const [passwordToggle] = screen.getAllByRole('button', { name: 'Show password' });

  fireEvent.press(passwordToggle);

  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
  expect(screen.getByLabelText('Confirm password').props.secureTextEntry).toBe(true);
});

it('shows a picked currency by its code and name, and sends its id as base_currency_id', async () => {
  answerCurrencies();
  mockedRegister.mockReturnValue(new Promise(() => {}));
  await renderSignUp();

  await act(async () => {
    fireEvent.changeText(screen.getByLabelText('Name'), 'Anna');
    fireEvent.changeText(screen.getByLabelText('Email'), 'anna@kovalenko.co');
    fireEvent.changeText(screen.getByLabelText('Password'), 'secret12');
    fireEvent.changeText(screen.getByLabelText('Confirm password'), 'secret12');
  });
  await pickCurrency(7);

  expect(screen.getByText('USD · US dollar')).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByText('Create account'));
  });

  expect(mockedRegister).toHaveBeenCalledWith({
    name: 'Anna',
    email: 'anna@kovalenko.co',
    password: 'secret12',
    base_currency_id: 7,
  });
});

it('waits for the currencies, offers a retry when they fail, and keeps what was typed', async () => {
  failCurrencies();
  await renderSignUp();

  expect(await screen.findByText('Couldn’t load the currencies.')).toBeTruthy();

  await act(async () => fireEvent.changeText(screen.getByLabelText('Name'), 'Anna'));

  mockedRequest.mockReturnValue(new Promise(() => {}));
  await act(async () => {
    fireEvent.press(screen.getByText('Try again'));
  });

  expect(await screen.findByText('Loading currencies…')).toBeTruthy();
  expect(screen.queryByText('Couldn’t load the currencies.')).toBeNull();
  expect(screen.getByLabelText('Name').props.value).toBe('Anna');
});

it('opens Sign In from its link', async () => {
  answerCurrencies();
  const { navigation } = await renderSignUp();

  fireEvent.press(screen.getByText('Sign In'));

  expect(navigation.navigate).toHaveBeenCalledWith(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true });
});
