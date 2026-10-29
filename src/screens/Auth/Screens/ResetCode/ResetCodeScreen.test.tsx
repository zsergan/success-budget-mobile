import 'react-native-gesture-handler/jestSetup';
import type { AppStateStatus, KeyboardMetrics } from 'react-native';
import { AppState, Dimensions, Keyboard } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as SecureStore from 'expo-secure-store';
import { act, fireEvent, screen } from '@testing-library/react-native';

import {
  answer,
  button,
  header,
  held,
  isDisabled,
  lost,
  mockRequest,
  press,
  reachCode,
  refused,
  REQUESTED,
  sentTo,
  settle,
  type,
  VERIFIED,
} from '@screens/Auth/passwordReset/flowFixtures';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));
jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));
jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockRequest(...args) }),
}));
jest.mock('expo-secure-store');
jest.mock('expo-font', () => ({ loadAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-clipboard', () => ({ getStringAsync: jest.fn() }));

jest.useFakeTimers();

const WRONG = refused(400, 'PASSWORD_RESET_CODE_INVALID');
const UNUSABLE = refused(400, 'PASSWORD_RESET_CODE_UNUSABLE');

const codeField = () => screen.getByLabelText('6-digit code');

const enterCode = (code: string) => type('6-digit code', code);

const submitCode = async (code: string) => {
  await enterCode(code);
  await press('Next');
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
});

describe('code entry', () => {
  it('shows where the code went and keeps Next off until six digits are in', async () => {
    answer({ request: [REQUESTED] });
    await reachCode();

    expect(screen.getByText('Enter the 6-digit code we sent to')).toBeTruthy();
    expect(screen.getByText('anna@kovalenko.co')).toBeTruthy();
    expect(isDisabled('Next')).toBe(true);

    await enterCode('04291');
    expect(isDisabled('Next')).toBe(true);

    await enterCode('042917');
    expect(isDisabled('Next')).toBe(false);
  });

  it('keeps leading zeros and drops anything that isn’t a digit', async () => {
    answer({ request: [REQUESTED], verify: [VERIFIED] });
    await reachCode();

    await enterCode('00 12-3a4');
    expect(codeField().props.value).toBe('001234');
    expect(screen.getByText('Pasted from clipboard.')).toBeTruthy();

    await press('Next');
    expect(sentTo('verify')).toEqual([{ email: 'anna@kovalenko.co', code: '001234' }]);
  });

  it('fills every box from the Paste button', async () => {
    jest.mocked(Clipboard.getStringAsync).mockResolvedValue('Your code: 482 913');
    answer({ request: [REQUESTED] });
    await reachCode();

    await press('Paste code');

    expect(codeField().props.value).toBe('482913');
    expect(screen.getByText('Pasted from clipboard.')).toBeTruthy();
    expect(isDisabled('Next')).toBe(false);
  });

  it('leaves the code alone when the clipboard holds no digits', async () => {
    jest.mocked(Clipboard.getStringAsync).mockResolvedValue('hello');
    answer({ request: [REQUESTED] });
    await reachCode();
    await enterCode('12');

    await press('Paste code');

    expect(codeField().props.value).toBe('12');
  });

  it('opens the new password only once the server accepts the code, sending it once however often Next is pressed', async () => {
    const pending = held();

    answer({ request: [REQUESTED], verify: [pending.answer] });
    await reachCode();
    await enterCode('042917');

    await act(async () => {
      fireEvent.press(button('Next'));
      fireEvent.press(button('Next'));
    });

    expect(button('Checking…').props.accessibilityState).toMatchObject({ busy: true });
    expect(codeField().props.editable).toBe(false);
    expect(isDisabled('Send again')).toBe(true);
    expect(header('Check your email')).toBeTruthy();

    await act(async () => pending.settle(VERIFIED));
    await settle();

    expect(sentTo('verify')).toHaveLength(1);
    expect(header('Create a new password')).toBeTruthy();
  });
});

describe('code failures', () => {
  it('marks a wrong code on the field until it is edited', async () => {
    answer({ request: [REQUESTED], verify: [WRONG] });
    await reachCode();
    await submitCode('000000');

    expect(codeField().props.accessibilityHint).toBe('That code doesn’t match. Check the latest email and try again.');
    expect(isDisabled('Next')).toBe(true);

    await enterCode('00000');
    expect(codeField().props.accessibilityHint).toBeUndefined();
  });

  it('blocks the code after the fifth wrong one and offers a new code once the cooldown ends', async () => {
    answer({ request: [REQUESTED, REQUESTED], verify: [WRONG, WRONG, WRONG, WRONG, UNUSABLE] });
    await reachCode();

    for (const code of ['000001', '000002', '000003', '000004', '000005']) await submitCode(code);

    expect(screen.getByText('Too many wrong attempts')).toBeTruthy();
    expect(codeField().props.editable).toBe(false);
    expect(codeField().props.value).toBe('');
    expect(button(/^Send new code in 0:\d\d$/)).toBeTruthy();
    expect(isDisabled(/^Send new code in/)).toBe(true);
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();

    await settle(60_000);
    await press('Send new code');

    expect(sentTo('request')).toHaveLength(2);
    expect(screen.queryByText('Too many wrong attempts')).toBeNull();
    expect(codeField().props.editable).toBe(true);
    expect(
      screen.getByText(/^Use the code from the newest email; earlier codes stop working\. You can resend in 0:5\d\.$/),
    ).toBeTruthy();
  });

  it('says the code no longer works when the device can’t tell why', async () => {
    answer({ request: [REQUESTED], verify: [UNUSABLE] });
    await reachCode();
    await submitCode('111111');

    expect(screen.getByText('This code no longer works')).toBeTruthy();
    expect(button(/^Send new code/)).toBeTruthy();
  });

  it('keeps a resent code open past the first code’s 30 minutes, and says it expired once the server does', async () => {
    answer({ request: [REQUESTED, REQUESTED], verify: [UNUSABLE] });
    await reachCode();
    await settle(25 * 60_000);
    await press('Send again');
    await settle(6 * 60_000);

    expect(screen.queryByText('This code has expired')).toBeNull();
    expect(codeField().props.editable).toBe(true);

    await submitCode('042917');

    expect(sentTo('verify')).toHaveLength(1);
    expect(screen.getByText('This code has expired')).toBeTruthy();
    expect(button(/^Send new code/)).toBeTruthy();
  });

  it('takes a new code after a check the server accepted but whose answer was lost', async () => {
    answer({ request: [REQUESTED, REQUESTED], verify: [lost, VERIFIED] });
    await reachCode();
    await settle(25 * 60_000);
    await submitCode('042917');
    await press('Send again');
    await settle(6 * 60_000);

    expect(screen.queryByText('This code has expired')).toBeNull();
    expect(codeField().props.editable).toBe(true);

    await submitCode('583104');

    expect(sentTo('verify')).toEqual([
      { email: 'anna@kovalenko.co', code: '042917' },
      { email: 'anna@kovalenko.co', code: '583104' },
    ]);
    expect(header('Create a new password')).toBeTruthy();
  });

  it('keeps the code after a lost check, without counting it as a wrong attempt', async () => {
    answer({ request: [REQUESTED], verify: [lost, VERIFIED] });
    const store = await reachCode();
    await submitCode('042917');

    expect(screen.getByText('Couldn’t reach the server')).toBeTruthy();
    expect(screen.getByText('Your code is kept. Check your connection and try again.')).toBeTruthy();
    expect(codeField().props.value).toBe('042917');
    expect(store.getState().passwordReset.challenge?.wrongCodes).toBe(0);

    await press('Retry');

    expect(sentTo('verify')).toEqual([
      { email: 'anna@kovalenko.co', code: '042917' },
      { email: 'anna@kovalenko.co', code: '042917' },
    ]);
    expect(header('Create a new password')).toBeTruthy();
  });

  it('explains a server failure apart from a lost connection', async () => {
    answer({ request: [REQUESTED], verify: [refused(500, 'INTERNAL')] });
    await reachCode();
    await submitCode('042917');

    expect(screen.getByText('Recovery is temporarily unavailable')).toBeTruthy();
    expect(codeField().props.value).toBe('042917');
  });

  it('holds Next for the server’s Retry-After when too many wrong codes were tried this hour', async () => {
    answer({ request: [REQUESTED], verify: [refused(429, 'PASSWORD_RESET_RATE_LIMITED', { 'retry-after': '120' })] });
    await reachCode();
    await submitCode('042917');

    expect(screen.getByText('Too many attempts')).toBeTruthy();
    expect(isDisabled('Next')).toBe(true);

    await settle(120_000);
    expect(isDisabled('Next')).toBe(false);
  });
});

describe('resend', () => {
  it('counts down to Send again and sends a new code to the same address', async () => {
    answer({ request: [REQUESTED, REQUESTED] });
    await reachCode();
    await enterCode('123');

    expect(screen.getByText(/^No email\? Check spam — you can resend in 0:5\d\.$/)).toBeTruthy();
    expect(isDisabled('Send again')).toBe(true);

    await settle(60_000);

    expect(screen.getByText('No email? Check spam, then send a new code.')).toBeTruthy();
    expect(isDisabled('Send again')).toBe(false);

    await press('Send again');

    expect(sentTo('request')).toEqual([{ email: 'anna@kovalenko.co' }, { email: 'anna@kovalenko.co' }]);
    expect(codeField().props.value).toBe('');
    expect(
      screen.getByText(/^Use the code from the newest email; earlier codes stop working\. You can resend in 0:5\d\.$/),
    ).toBeTruthy();
    expect(isDisabled('Send again')).toBe(true);
    // The server only accepted it, so the one message about it says no more than that.
    expect(screen.getAllByText('If this address has a verified account, a code will be sent.')).toHaveLength(1);
  });

  it('sends one new code however often Send again is pressed', async () => {
    const pending = held();

    answer({ request: [REQUESTED, pending.answer] });
    await reachCode();
    await settle(60_000);

    const sendAgain = button('Send again');

    await act(async () => {
      fireEvent.press(sendAgain);
      fireEvent.press(sendAgain);
    });

    expect(button('Sending new code…')).toBeTruthy();
    expect(codeField().props.editable).toBe(false);
    expect(isDisabled('Next')).toBe(true);

    await act(async () => pending.settle(REQUESTED));
    await settle();

    expect(sentTo('request')).toHaveLength(2);
  });

  it('takes the server’s Retry-After when a resend is refused', async () => {
    answer({ request: [REQUESTED, refused(429, 'PASSWORD_RESET_RATE_LIMITED', { 'retry-after': '1800' })] });
    await reachCode();
    await settle(60_000);
    await press('Send again');

    expect(screen.getByText('Too many attempts')).toBeTruthy();
    expect(screen.getByText(/you can resend in 29:5\d\./)).toBeTruthy();
    expect(isDisabled('Send again')).toBe(true);
    expect(screen.queryByText('If this address has a verified account, a code will be sent.')).toBeNull();
  });

  it('recounts the wait from the clock on return to the app, not from a paused timer', async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];

    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
      listeners.push(listener);
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    answer({ request: [REQUESTED] });
    await reachCode();

    expect(screen.getByText(/you can resend in 0:5\d\./)).toBeTruthy();

    // The app was in the background: the clock moved, the interval didn't fire.
    await act(async () => {
      jest.setSystemTime(Date.now() + 45_000);
      listeners.forEach((listener) => listener('active'));
    });

    expect(screen.getByText(/you can resend in 0:1\d\./)).toBeTruthy();
  });

  it('keeps the cooldown when going back to the email and forward again', async () => {
    answer({ request: [REQUESTED] });
    await reachCode();
    await settle(30_000);

    await press('Change email');
    await press('Send code');

    expect(sentTo('request')).toHaveLength(1);
    expect(screen.getByText(/you can resend in 0:[23]\d\./)).toBeTruthy();
  });
});

describe('stale answers', () => {
  it('drops a check that answers after the screen was left', async () => {
    const pending = held();

    answer({ request: [REQUESTED], verify: [pending.answer] });
    const store = await reachCode();
    await enterCode('042917');
    await act(async () => {
      fireEvent.press(button('Next'));
    });

    await press('Back');
    await act(async () => pending.settle(VERIFIED));
    await settle();

    expect(header('Reset password')).toBeTruthy();
    expect(store.getState().passwordReset.authorization).toBeNull();
  });

  it('drops a resend that answers after the screen was left', async () => {
    const pending = held();

    answer({ request: [REQUESTED, pending.answer] });
    const store = await reachCode();
    await settle(60_000);
    const { resendAvailableAt } = store.getState().passwordReset;
    await act(async () => {
      fireEvent.press(button('Send again'));
    });

    await press('Back');
    await act(async () => pending.settle(REQUESTED));
    await settle();

    expect(store.getState().passwordReset.resendAvailableAt).toBe(resendAvailableAt);
  });
});

describe('keyboard', () => {
  const keyboardUp = () =>
    jest
      .spyOn(Keyboard, 'metrics')
      .mockReturnValue({ height: 300, screenX: 0, screenY: 500, width: 393 } as KeyboardMetrics);

  it('keeps only the code and Next in view while the keypad is up', async () => {
    answer({ request: [REQUESTED] });
    await reachCode();
    keyboardUp();
    await press('Change email');
    await press('Send code');

    expect(screen.getByText('Enter the 6-digit code we sent to')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Send again' })).toBeNull();
    expect(screen.queryByText('Remembered your password?')).toBeNull();
  });

  it('also folds the subtitle, address and note away on a small screen', async () => {
    const window = Dimensions.get('window');

    answer({ request: [REQUESTED] });
    await reachCode();
    keyboardUp();
    await act(async () => {
      Dimensions.set({ window: { ...window, height: 667 }, screen: { ...window, height: 667 } });
    });
    await press('Change email');
    await press('Send code');

    expect(screen.queryByText('Enter the 6-digit code we sent to')).toBeNull();
    expect(screen.queryByLabelText('Change email')).toBeNull();
    expect(screen.queryByText(/you can resend in/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();

    await act(async () => {
      Dimensions.set({ window, screen: window });
    });
  });
});
