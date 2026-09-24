import { createAppStore } from '@redux/Store';
import { logoutMe } from '@redux/state/auth/thunks';
import { baseApi } from './baseApi';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

jest.mock('expo-secure-store');

// RTK Query batches store notifications on an animation frame, which would otherwise fire after teardown.
jest.useFakeTimers();

const probeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    probe: build.query<string, void>({ query: () => ({ url: '/probe' }) }),
  }),
});

const cachedQueryCount = (store: ReturnType<typeof createAppStore>) =>
  Object.keys(store.getState()[baseApi.reducerPath].queries).length;

beforeEach(() => jest.clearAllMocks());

describe('session isolation', () => {
  it('drops cached data on logout', async () => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({ data: 'first session' });
    await store.dispatch(probeApi.endpoints.probe.initiate());

    expect(cachedQueryCount(store)).toBe(1);

    await store.dispatch(logoutMe());

    expect(cachedQueryCount(store)).toBe(0);
  });

  it('aborts a query still in flight at logout and never caches it', async () => {
    const store = createAppStore();
    let signal: AbortSignal | undefined;

    mockedRequest.mockImplementation(
      (config: { signal: AbortSignal }) =>
        new Promise((_, reject) => {
          signal = config.signal;
          signal.addEventListener('abort', () => reject(new Error('canceled')));
        }),
    );

    const pending = store.dispatch(probeApi.endpoints.probe.initiate());

    await store.dispatch(logoutMe());
    await pending;

    expect(signal?.aborted).toBe(true);
    expect(cachedQueryCount(store)).toBe(0);
  });
});
