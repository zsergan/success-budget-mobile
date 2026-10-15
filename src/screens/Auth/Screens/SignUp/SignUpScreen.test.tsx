import { Provider } from 'react-redux';
import { Modal, TextInput } from 'react-native';
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

const createAccountButton = () => screen.getByRole('button', { name: 'Create account' });

const type = async (label: string, text: string) => {
  await act(async () => {
    fireEvent.changeText(screen.getByLabelText(label), text);
  });
};

const leave = async (label: string) => {
  await act(async () => {
    fireEvent(screen.getByLabelText(label), 'blur');
  });
};

const fillInValidForm = async () => {
  await type('Name', 'Anna');
  await type('Email', 'anna@kovalenko.co');
  await type('Password', 'secret12');
  await type('Confirm password', 'secret12');
  await pickCurrency(7);
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

  await fillInValidForm();

  expect(screen.getByText('USD · US dollar')).toBeTruthy();

  await act(async () => {
    fireEvent.press(createAccountButton());
  });

  expect(mockedRegister).toHaveBeenCalledWith({
    name: 'Anna',
    email: 'anna@kovalenko.co',
    password: 'secret12',
    base_currency_id: 7,
  });
});

describe('validation', () => {
  it('shows nothing wrong with a fresh, empty form, and keeps Create account off', async () => {
    answerCurrencies();
    await renderSignUp();

    expect(screen.queryByText(/^Enter .*\.$|^Pick a currency\.$|Too short|don’t match/)).toBeNull();
    expect(createAccountButton().props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('explains an empty field once it is left, and drops the message once it is filled in', async () => {
    answerCurrencies();
    await renderSignUp();

    await leave('Name');

    expect(screen.getByText('Enter your name.')).toBeTruthy();

    await type('Name', 'Anna');

    expect(screen.queryByText('Enter your name.')).toBeNull();
  });

  it('counts the characters of a short password, and updates the count as it is typed', async () => {
    answerCurrencies();
    await renderSignUp();

    await type('Password', 'abc12');
    await leave('Password');

    expect(screen.getByText('Too short: 5 characters of the 8 required.')).toBeTruthy();
    expect(screen.queryByText('At least 8 characters, with a letter and a digit.')).toBeNull();

    await type('Password', 'a');

    expect(screen.getByText('Too short: 1 character of the 8 required.')).toBeTruthy();

    await type('Password', 'abcdefgh');

    expect(screen.getByText('Add at least one digit.')).toBeTruthy();

    await type('Password', 'abcdefg1');

    expect(screen.getByText('At least 8 characters, with a letter and a digit.')).toBeTruthy();
  });

  it('checks the confirmation again whenever the password changes', async () => {
    answerCurrencies();
    await renderSignUp();

    await type('Password', 'secret12');
    await type('Confirm password', 'secret12');
    await leave('Confirm password');

    expect(screen.queryByText('Passwords don’t match.')).toBeNull();

    await type('Password', 'secret123');

    expect(screen.getByText('Passwords don’t match.')).toBeTruthy();

    await type('Confirm password', 'secret123');

    expect(screen.queryByText('Passwords don’t match.')).toBeNull();
  });

  it('marks an email whose format is right, and only then', async () => {
    answerCurrencies();
    await renderSignUp();

    const checkMarks = () => screen.UNSAFE_queryAllByProps({ name: 'check' });

    await type('Email', 'anna@kovalenko');
    await leave('Email');

    expect(screen.getByText('Enter a valid email, like you@example.com.')).toBeTruthy();
    expect(checkMarks()).toHaveLength(0);

    await type('Email', 'anna@kovalenko.co');

    expect(screen.queryByText('Enter a valid email, like you@example.com.')).toBeNull();
    expect(checkMarks()).toHaveLength(1);
  });

  it('asks for a currency when the list closes without one', async () => {
    answerCurrencies();
    await renderSignUp();

    fireEvent.press(screen.getByRole('button', { name: 'Currency of your space' }));
    await act(async () => {
      fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
    });

    expect(screen.getByText('Pick a currency.')).toBeTruthy();
  });

  it('turns Create account on for a valid form, and holds it while the account is created', async () => {
    answerCurrencies();
    mockedRegister.mockReturnValue(new Promise(() => {}));
    await renderSignUp();

    await fillInValidForm();

    expect(createAccountButton().props.accessibilityState).toMatchObject({ disabled: false });

    await act(async () => {
      fireEvent.press(createAccountButton());
    });
    await act(async () => {
      fireEvent.press(createAccountButton());
    });

    expect(createAccountButton().props.accessibilityState).toMatchObject({ busy: true });
    expect(mockedRegister).toHaveBeenCalledTimes(1);
  });
});

it('moves on to the next field from the keyboard', async () => {
  answerCurrencies();
  await renderSignUp();
  const focus = jest.spyOn(TextInput.prototype, 'focus');
  const focusedLabels = () => focus.mock.contexts.map((input) => (input as TextInput).props.accessibilityLabel);

  for (const label of ['Name', 'Email', 'Password']) {
    fireEvent(screen.getByLabelText(label), 'submitEditing');
  }
  // react-hook-form focuses on the next tick.
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

  expect(focusedLabels()).toEqual(['Email', 'Password', 'Confirm password']);
  expect(screen.getByLabelText('Confirm password').props.returnKeyType).toBe('done');
});

it('keeps what was typed when the server is unreachable, and lets the form be sent again', async () => {
  answerCurrencies();
  mockedRegister.mockRejectedValueOnce({ code: 'ERR_NETWORK', message: 'Network Error' });
  const { navigation } = await renderSignUp();

  await fillInValidForm();
  await act(async () => {
    fireEvent.press(createAccountButton());
  });

  expect(navigation.navigate).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Name').props.value).toBe('Anna');
  expect(screen.getByLabelText('Email').props.value).toBe('anna@kovalenko.co');
  expect(screen.getByLabelText('Password').props.value).toBe('secret12');
  expect(screen.getByLabelText('Confirm password').props.value).toBe('secret12');
  expect(screen.getByText('USD · US dollar')).toBeTruthy();
  expect(createAccountButton().props.accessibilityState).toMatchObject({ disabled: false, busy: false });

  mockedRegister.mockResolvedValueOnce({ email: 'anna@kovalenko.co' } as Awaited<ReturnType<typeof register>>);
  await act(async () => {
    fireEvent.press(createAccountButton());
  });

  expect(mockedRegister).toHaveBeenCalledTimes(2);
  expect(navigation.navigate).toHaveBeenCalledWith(ScreenNames.VERIFY_EMAIL_SCREEN);
});

it('waits for the currencies, offers a retry when they fail, and keeps what was typed', async () => {
  failCurrencies();
  await renderSignUp();

  expect(await screen.findByText('Couldn’t load the currencies.')).toBeTruthy();

  await act(async () => fireEvent.changeText(screen.getByLabelText('Name'), 'Anna'));

  mockedRequest.mockReturnValue(new Promise(() => {}));
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Load the currencies again' }));
  });

  expect(await screen.findByText('Loading currencies…')).toBeTruthy();
  expect(screen.queryByText('Couldn’t load the currencies.')).toBeNull();
  expect(screen.getByLabelText('Name').props.value).toBe('Anna');
});

it('opens Sign In from its link', async () => {
  answerCurrencies();
  const { navigation } = await renderSignUp();

  fireEvent.press(screen.getByRole('link', { name: 'Sign In' }));

  expect(navigation.navigate).toHaveBeenCalledWith(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true });
});
