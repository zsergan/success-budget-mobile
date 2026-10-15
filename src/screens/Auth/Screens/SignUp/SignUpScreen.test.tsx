import { Children, isValidElement } from 'react';
import { Provider } from 'react-redux';
import { Modal, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { register } from '@api/auth.api';
import { createAppStore } from '@redux/Store';
import { registerMe, verifyEmailMe } from '@redux/state/auth/thunks';
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
const mockedAddAlert = jest.fn();

jest.mock('@hooks', () => ({
  ...jest.requireActual('@hooks'),
  useAlert: () => ({ addAlert: mockedAddAlert }),
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

const renderSignUp = async (store = createAppStore()) => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn(), isFocused: jest.fn(() => true) };

  const view = render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Provider store={store}>
        <SignUpScreen {...({ navigation, route: {} } as unknown as RootStackScreenProps<ScreenNames.SIGN_UP_SCREEN>)} />
      </Provider>
    </SafeAreaProvider>,
  );
  await act(async () => {});

  return { navigation, store, unmount: view.unmount };
};

const createAccountButton = () => screen.getByRole('button', { name: 'Create account' });

const currencyField = () => screen.getByRole('button', { name: 'Currency of your space' });

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
  expect(currencyField().props.accessibilityValue).toEqual({ text: 'USD · US dollar' });

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

  it('asks to repeat the password when the confirmation is left empty, not that they differ', async () => {
    answerCurrencies();
    await renderSignUp();

    await type('Password', 'secret12');
    await leave('Confirm password');

    expect(screen.getByText('Repeat the password.')).toBeTruthy();
    expect(screen.queryByText('Passwords don’t match.')).toBeNull();
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

  it('opens the list on no currency, and asks for one when it closes there', async () => {
    answerCurrencies();
    await renderSignUp();

    fireEvent.press(screen.getByRole('button', { name: 'Currency of your space' }));

    const list = screen.UNSAFE_getByType(Picker);
    const rows = Children.toArray(list.props.children).filter(isValidElement<{ label: string; value: unknown }>);

    expect(rows.find((row) => row.props.value === list.props.selectedValue)?.props.label).toBe('Pick a currency');

    await act(async () => {
      fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
    });

    expect(screen.getByText('Pick a currency.')).toBeTruthy();
  });

  it('drops the currency when the list is turned back to no currency', async () => {
    answerCurrencies();
    await renderSignUp();

    await fillInValidForm();
    await act(async () => screen.UNSAFE_getByType(Picker).props.onValueChange('', 0));
    await act(async () => {
      fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
    });

    expect(screen.getByText('Pick a currency.')).toBeTruthy();
    expect(createAccountButton().props.accessibilityState).toMatchObject({ disabled: true });
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
  expect(currencyField().props.accessibilityState).toMatchObject({ disabled: true, busy: false });

  await act(async () => fireEvent.changeText(screen.getByLabelText('Name'), 'Anna'));

  mockedRequest.mockReturnValue(new Promise(() => {}));
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Load the currencies again' }));
  });

  expect(await screen.findByText('Loading currencies…')).toBeTruthy();
  expect(currencyField().props.accessibilityState).toMatchObject({ disabled: true, busy: true });
  expect(screen.queryByText('Couldn’t load the currencies.')).toBeNull();
  expect(screen.getByLabelText('Name').props.value).toBe('Anna');
});

it('opens Sign In from its link', async () => {
  answerCurrencies();
  const { navigation } = await renderSignUp();

  fireEvent.press(screen.getByRole('link', { name: 'Sign In' }));

  expect(navigation.navigate).toHaveBeenCalledWith(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true });
});

describe('going on to verification', () => {
  const registered = (email: string) => ({ email }) as Awaited<ReturnType<typeof register>>;

  // An earlier sign-up of this session whose code was never entered.
  const storeWithEarlierSignUp = () => {
    const store = createAppStore();
    const payload = { name: 'Anna', email: 'old@kovalenko.co', password: 'secret12', base_currency_id: 7 };

    store.dispatch(registerMe.fulfilled({ email: payload.email }, 'earlier', payload));

    return store;
  };

  const sendForm = async () => {
    await fillInValidForm();
    await act(async () => {
      fireEvent.press(createAccountButton());
    });
  };

  it('stays on a reopened Sign Up while an earlier sign-up still waits for its code', async () => {
    answerCurrencies();
    const { navigation } = await renderSignUp(storeWithEarlierSignUp());

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Email').props.value).toBe('');
  });

  it('verifies the address this form registered, not the earlier one', async () => {
    answerCurrencies();
    mockedRegister.mockResolvedValue(registered('anna@kovalenko.co'));
    const { navigation, store } = await renderSignUp(storeWithEarlierSignUp());

    await sendForm();

    expect(navigation.navigate).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).toHaveBeenCalledWith(ScreenNames.VERIFY_EMAIL_SCREEN);
    expect(store.getState().auth.userEmail).toBe('anna@kovalenko.co');
  });

  it('goes on to verification when the code for this address is already on its way', async () => {
    answerCurrencies();
    mockedRegister.mockRejectedValue({
      response: {
        status: 429,
        data: { statusCode: 429, code: 'CONFIRMATION_EMAIL_RATE_LIMITED', message: 'Already requested' },
        headers: {},
      },
      config: { url: '/users/register' },
    });
    const { navigation, store } = await renderSignUp();

    await sendForm();

    expect(navigation.navigate).toHaveBeenCalledWith(ScreenNames.VERIFY_EMAIL_SCREEN);
    expect(store.getState().auth.userEmail).toBe('anna@kovalenko.co');
  });

  it('leaves a user who went away during the request where they are', async () => {
    answerCurrencies();
    let answer: (profile: Awaited<ReturnType<typeof register>>) => void = () => {};
    mockedRegister.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const { navigation, unmount } = await renderSignUp();

    await sendForm();
    navigation.isFocused.mockReturnValue(false);
    unmount();
    await act(async () => answer(registered('anna@kovalenko.co')));

    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('keeps verifying the address registered last when one sent before leaving answers late', async () => {
    answerCurrencies();
    let answerFirst: (profile: Awaited<ReturnType<typeof register>>) => void = () => {};
    mockedRegister.mockReturnValueOnce(new Promise((resolve) => (answerFirst = resolve)));
    const first = await renderSignUp();

    await sendForm();
    first.navigation.isFocused.mockReturnValue(false);
    first.unmount();

    mockedRegister.mockResolvedValueOnce(registered('bohdan@kovalenko.co'));
    const second = await renderSignUp(first.store);

    await fillInValidForm();
    await type('Email', 'bohdan@kovalenko.co');
    await act(async () => {
      fireEvent.press(createAccountButton());
    });

    expect(second.navigation.navigate).toHaveBeenCalledWith(ScreenNames.VERIFY_EMAIL_SCREEN);
    expect(first.store.getState().auth.userEmail).toBe('bohdan@kovalenko.co');

    await act(async () => answerFirst(registered('anna@kovalenko.co')));

    expect(first.store.getState().auth.userEmail).toBe('bohdan@kovalenko.co');
    expect(first.navigation.navigate).not.toHaveBeenCalled();
    expect(second.navigation.navigate).toHaveBeenCalledTimes(1);
  });
});

describe('a failed registration', () => {
  const rejectWith = (status: number, message: string) =>
    mockedRegister.mockRejectedValue({
      response: { status, data: { statusCode: status, message }, headers: {} },
      config: { url: '/users/register' },
    });

  const sendForm = async () => {
    await fillInValidForm();
    await act(async () => {
      fireEvent.press(createAccountButton());
    });
  };

  it('shows nothing for a code the verify screen refused', async () => {
    answerCurrencies();
    const store = createAppStore();
    store.dispatch(
      verifyEmailMe.rejected(
        null,
        'earlier',
        { email: 'anna@kovalenko.co', code: '000000' },
        {
          statusCode: 400,
          message: 'Invalid verification code',
          path: '/users/verify-email',
          timestamp: '2026-01-01T00:00:00.000Z',
        },
      ),
    );

    await renderSignUp(store);

    expect(mockedAddAlert).not.toHaveBeenCalled();
  });

  it('tells its own failure once, and not again when Sign Up is opened anew', async () => {
    answerCurrencies();
    rejectWith(409, 'Email already registered');
    const { navigation, store, unmount } = await renderSignUp();

    await sendForm();

    expect(mockedAddAlert).toHaveBeenCalledTimes(1);
    expect(mockedAddAlert).toHaveBeenCalledWith('Email already registered');
    expect(navigation.navigate).not.toHaveBeenCalled();

    unmount();
    await renderSignUp(store);

    expect(mockedAddAlert).toHaveBeenCalledTimes(1);
  });

  it('keeps quiet about a failure that answers after the user left', async () => {
    answerCurrencies();
    let answer: (error: object) => void = () => {};
    mockedRegister.mockReturnValue(new Promise((_, reject) => (answer = reject)));
    const { navigation, unmount } = await renderSignUp();

    await sendForm();
    navigation.isFocused.mockReturnValue(false);
    unmount();
    await act(async () => answer({ response: { status: 409, data: {}, headers: {} }, config: {} }));

    expect(mockedAddAlert).not.toHaveBeenCalled();
  });
});
