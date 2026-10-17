import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import ThemeProvider from '@components/ThemeProvider/ThemeProvider';
import RootNavigator from '@navigation/RootNavigator';
import { createAppStore } from '@redux/Store';

// Recovery tests drive the real navigator; each test file mocks `@api/instance` to send requests here.
export const mockRequest = jest.fn();

type Answer = () => Promise<unknown>;

export const ok =
  (data: unknown): Answer =>
  () =>
    Promise.resolve({ data });

export const refused =
  (status: number, code: string, headers: Record<string, string> = {}): Answer =>
  () =>
    Promise.reject({
      response: { status, data: { statusCode: status, code, message: code }, headers },
      config: { url: '/users/password-reset' },
    });

export const lost: Answer = () => Promise.reject({ code: 'ERR_NETWORK', message: 'Network Error' });

export const REQUESTED = ok({ message: 'Sent', resend_after_seconds: 60 });
export const VERIFIED = ok({ reset_token: 'reset-token', expires_in_seconds: 600 });

// An answer the test settles itself, to act while the request is still running.
export const held = () => {
  let settle: (answer: Answer) => void = () => {};
  const answer: Answer = () => new Promise((resolve, reject) => (settle = (next) => next().then(resolve, reject)));

  return { answer, settle: (next: Answer) => settle(next) };
};

// Each route answers with the next of its queued answers; a route with none left never answers.
export const answer = (answers: Record<string, Answer[]>) =>
  mockRequest.mockImplementation(({ url }: { url: string }) => {
    const next = answers[url.replace('/users/password-reset/', '')]?.shift();

    return next ? next() : new Promise(() => {});
  });

export const sentTo = (route: string) =>
  mockRequest.mock.calls.filter(([config]) => config.url === `/users/password-reset/${route}`).map(([c]) => c.data);

export const settle = (ms = 1000) => act(() => jest.advanceTimersByTimeAsync(ms));

export const button = (name: string | RegExp) => screen.getByRole('button', { name });

export const press = async (name: string | RegExp) => {
  fireEvent.press(button(name));
  await settle();
};

export const type = async (label: string, text: string) => {
  fireEvent.changeText(screen.getByLabelText(label), text);
  await settle();
};

export const header = (name: string) => screen.queryByRole('header', { name });

export const isDisabled = (name: string | RegExp) => !!button(name).props.accessibilityState?.disabled;

const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

export const openSignIn = async () => {
  const store = createAppStore();

  render(
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={metrics}>
        <Provider store={store}>
          <RootNavigator />
        </Provider>
      </SafeAreaProvider>
    </ThemeProvider>,
  );
  await settle();
  fireEvent.press(screen.getByText('Sign In'));
  await settle();

  return store;
};

export const openForgotPassword = async (email = 'anna@kovalenko.co') => {
  const store = await openSignIn();

  await type('Email', email);
  fireEvent.press(screen.getByText('Forgot password?'));
  await settle();

  return store;
};

export const reachCode = async () => {
  const store = await openForgotPassword();

  await press('Send code');

  return store;
};

export const reachNewPassword = async () => {
  const store = await reachCode();

  await type('6-digit code', '042917');
  await press('Next');

  return store;
};

export const savePassword = async (password = 'sunny2026') => {
  await type('New password', password);
  await type('Confirm password', password);
  await press('Save new password');
};
