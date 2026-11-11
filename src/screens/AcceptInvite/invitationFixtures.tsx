import { Linking } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, render, screen } from '@testing-library/react-native';

import ThemeProvider from '@components/ThemeProvider/ThemeProvider';
import ToastProvider from '@components/Toast/ToastProvider';
import RootNavigator from '@navigation/RootNavigator';
import { loginMe } from '@redux/state/auth/thunks';
import { createAppStore } from '@redux/Store';
import { SpaceType } from '@shared/enums';

// Invitation tests drive the real navigator; each test file mocks `@api/instance` to send requests to `mockRequest`
// and `expo-secure-store` to `mockSecureStore`.
export const mockRequest = jest.fn();
export const mockSecureStore = new Map<string, string>();

export type Answer = () => Promise<unknown>;
interface Request {
  method: string;
  url: string;
  data?: { token?: string; code?: string };
}

export const token = (id: number) => `${id}.${'a'.repeat(43)}`;
export const link = (id: number) => `successbudget://invite#token=${token(id)}`;

export const ok =
  (data: unknown): Answer =>
  () =>
    Promise.resolve({ data });
export const refused =
  (status: number, code: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}): Answer =>
  () =>
    Promise.reject({ response: { status, data: { statusCode: status, code, message: code, ...extra }, headers } });
export const lost: Answer = () => Promise.reject({ code: 'ERR_NETWORK', message: 'Network Error' });

// An answer the test settles itself, to act while the request is still running.
export const held = () => {
  let settle: (answer: Answer) => void = () => {};
  const answer: Answer = () => new Promise((resolve, reject) => (settle = (next) => next().then(resolve, reject)));

  return { answer, settle: (next: Answer) => settle(next) };
};

export const currency = { id: 3, code: 'EUR', name: 'Euro' };
export const personal = { id: 1, name: 'Personal', type: SpaceType.PERSONAL, currency, role: 'owner', member_count: 1 };
export const family = { id: 41, name: 'Family', type: SpaceType.GROUP, currency, currency_id: 3 };
export const previewOf = (name: string) => ok({ space: { name, currency }, expires_at: '2026-11-08T10:00:00.000Z' });

// Previews and accepts answer from queues keyed by token or code, the launch's reads by URL; a queue keeps answering
// with its last entry. Other reads fail at once, so none stays pending and holds back invalidations; other writes
// never answer.
export const server: {
  previews: Record<string, Answer[]>;
  accepts: Record<string, Answer[]>;
  reads: Record<string, Answer[]>;
} = { previews: {}, accepts: {}, reads: {} };

const route = ({ method, url, data }: Request) => {
  const queue =
    url === '/spaces/invites/preview'
      ? server.previews[data?.token ?? '']
      : url === '/spaces/invites/accept'
        ? server.accepts[data?.token ?? data?.code ?? '']
        : method === 'GET'
          ? server.reads[url]
          : undefined;
  const next = queue && queue.length > 1 ? queue.shift() : queue?.[0];

  if (next) return next();

  return method === 'GET' ? refused(503, 'SERVICE_UNAVAILABLE')() : new Promise(() => {});
};

const urlListeners = new Set<(event: { url: string }) => void>();
let initialUrl: string | null = null;

export const setInitialUrl = (url: string | null) => {
  initialUrl = url;
};

// Call in beforeEach: a signed-in user's launch answers, and the platform's link events.
export const resetInvitationWorld = () => {
  mockSecureStore.clear();
  server.previews = {};
  server.accepts = {};
  server.reads = {
    '/users/profile': [ok({ id: 7, email: 'anna@example.com', name: 'Anna' })],
    '/spaces': [ok([personal])],
    '/spaces/1/wallets': [ok({ wallets: [], total_balance: 0, total_balance_currency: 'EUR', delta_percent: 0 })],
  };
  mockRequest.mockImplementation(route);
  urlListeners.clear();
  initialUrl = null;
  jest.spyOn(Linking, 'getInitialURL').mockImplementation(async () => initialUrl);
  jest.spyOn(Linking, 'addEventListener').mockImplementation((type, listener) => {
    const onUrl = listener as (event: { url: string }) => void;
    if (type === 'url') urlListeners.add(onUrl);
    return { remove: () => urlListeners.delete(onUrl) } as unknown as ReturnType<typeof Linking.addEventListener>;
  });
};

export const settle = (ms = 1000) => act(() => jest.advanceTimersByTimeAsync(ms));

const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

export const openApp = async () => {
  const store = createAppStore();

  render(
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={metrics}>
        <Provider store={store}>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </Provider>
      </SafeAreaProvider>
    </ThemeProvider>,
  );
  await settle();

  return store;
};

export const receive = async (url: string) => {
  await act(async () => urlListeners.forEach((listener) => listener({ url })));
  await settle();
};

export const signIn = async (store: ReturnType<typeof createAppStore>) => {
  await act(async () => {
    store.dispatch(loginMe.fulfilled('a-token', 'login', { email: 'anna@example.com', password: 'password1' }));
  });
  await settle();
};

export const button = (name: string | RegExp) => screen.getByRole('button', { name });

export const isOnWelcome = () => screen.queryByText('See where the money goes') !== null;

// One per invitation screen in the stack, by link or by code.
export const invitationsShown = () =>
  screen.queryAllByText('You were invited to a shared space. Join it only if you expected this.').length;
export const codeFormsShown = () => screen.queryAllByText('Enter the 6-digit code from the invitation email.').length;

export const isOnHome = () =>
  invitationsShown() === 0 && codeFormsShown() === 0 && screen.queryByText('Recent activity') !== null;

export const sentTo = (url: string) =>
  mockRequest.mock.calls.map(([config]: [Request]) => config).filter((config) => config.url === url);
