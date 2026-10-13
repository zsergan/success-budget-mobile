import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { Category, LimitView, Space, Transaction, WalletWithBalance } from '@api/dto';
import useLoadInitData from '@hooks/useLoadInitData';
import { getLoadState } from '@redux/api/loadState';
import { useAppSelector, useRecentArg, useSpaceArg } from '@redux/hooks';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { useGetCategoriesQuery, categoryApi } from '@redux/state/category/api';
import { useGetLimitsQuery, limitApi } from '@redux/state/limit/api';
import { activateSpace, refreshSpaceData } from '@redux/state/space/thunks';
import { transactionApi, useGetRecentTransactionsQuery } from '@redux/state/transaction/api';
import { useGetWalletsQuery, walletApi } from '@redux/state/wallet/api';
import { createAppStore } from '@redux/Store';
import useTransactionsData from '@screens/Transactions/hooks/useTransactionsData';
import { AppColor, SpaceType, TransactionKind, TransactionType } from '@shared/enums';
import { getCurrentMonthRange } from '@shared/utils';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers({ now: new Date('2026-01-15T12:00:00') });

interface RequestConfig {
  url: string;
  method?: string;
  data?: Record<string, unknown>;
  params?: { from: string; to: string; limit?: number };
}

interface SpaceDb {
  categories: Category[];
  limits: LimitView[];
  wallets: WalletWithBalance[];
  // Stored with their ids, like the backend's table; responses expose only the joined relations.
  transactions: (Omit<Transaction, 'wallet' | 'category'> & { wallet_id: number; category_id: number })[];
}

const category = (id: number, name: string, limit: number | null): Category => ({
  id,
  name,
  transaction_type: TransactionType.EXPENSE,
  icon: 'Grocery',
  color: AppColor.SLATE,
  is_active: 1,
  transaction_count: 0,
  limit: limit === null ? null : { id: limit, name: null },
  archived_at: null,
});

const STAMPS = { created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' };

const space = (id: number): Space => ({
  id,
  name: `Space ${id}`,
  type: SpaceType.GROUP,
  currency: { id: 1, code: 'USD', name: 'US Dollar' },
  role: 'owner',
  member_count: 1,
  created_at: '2026-01-01T00:00:00.000Z',
});

// A tiny backend that keeps the relations the real one derives on every read:
// history rows join their current category and wallet, limits list their categories.
const createBackend = () => {
  const dbs: Record<number, SpaceDb> = {};
  const db = (spaceId: number) =>
    (dbs[spaceId] ??= {
      categories: [category(5, 'Food', 10), category(6, 'Taxi', null)],
      limits: [{ id: 10, name: null, amount: '100', spent: 0, in_percent: 0, categories: [] }],
      wallets: [{ id: 1, wallet_name: `Wallet of space ${spaceId}`, design: AppColor.SLATE, balance: 0 }],
      transactions: [],
    });

  const toRow = (
    spaceDb: SpaceDb,
    { wallet_id, category_id, ...row }: SpaceDb['transactions'][number],
  ): Transaction => {
    const wallet = spaceDb.wallets.find((item) => item.id === wallet_id);
    const { id, name, transaction_type, icon, color, is_active } = spaceDb.categories.find(
      (item) => item.id === category_id,
    )!;

    return {
      ...row,
      wallet: wallet ? { id: wallet.id, wallet_name: wallet.wallet_name, design: wallet.design, ...STAMPS } : null,
      category: { id, name, transaction_type, icon, color, is_active, is_archived: is_active === 0, ...STAMPS },
    };
  };

  const handle = ({ url, method = 'GET', data, params }: RequestConfig): unknown => {
    if (url === '/spaces') return [space(1), space(2)];
    if (url === '/users/profile') return { id: 1, email: 'me@example.com', name: 'Me' };

    const [, rawSpaceId, resource, rawId] = url.match(/^\/spaces\/(\d+)\/(\w+)(?:\/(\w+))?$/)!;
    const spaceDb = db(Number(rawSpaceId));
    const id = Number(rawId);

    if (resource === 'wallets' && method === 'GET')
      return {
        total_balance: 0,
        total_balance_currency: 'USD',
        delta_percent: 0,
        wallets: spaceDb.wallets.map((wallet) => ({ wallet, total_spend: 0, total_income: 0 })),
      };
    if (resource === 'wallets' && method === 'PUT') {
      Object.assign(
        spaceDb.wallets.find((wallet) => wallet.id === id)!,
        data,
      );

      return null;
    }
    if (resource === 'categories' && method === 'GET') {
      const active = spaceDb.categories.filter((item) => item.is_active === 1);

      return { incomes: [], expenses: active, archived: spaceDb.categories.filter((item) => item.is_active === 0) };
    }
    if (resource === 'categories' && method === 'PUT') {
      const target = spaceDb.categories.find((item) => item.id === id)!;

      Object.assign(target, data);
      if (target.is_active === 0) target.limit = null;

      return target;
    }
    if (resource === 'limits' && method === 'GET')
      return {
        total: null,
        over_allocation: null,
        categories: spaceDb.limits.map((limit) => ({
          ...limit,
          categories: spaceDb.categories.filter((item) => item.limit?.id === limit.id),
        })),
      };
    if (resource === 'limits' && method === 'PUT') {
      const categoryIds = data!.category_ids as number[];

      spaceDb.categories.forEach((item) => {
        if (categoryIds.includes(item.id)) item.limit = { id, name: null };
        else if (item.limit?.id === id) item.limit = null;
      });

      return { id };
    }
    if (resource === 'transactions' && rawId === 'latest') {
      const last = spaceDb.transactions.at(-1);

      return last ? toRow(spaceDb, last) : null;
    }
    if (resource === 'transactions' && rawId === 'feed') {
      const items = spaceDb.transactions
        .map((row) => toRow(spaceDb, row))
        .reverse()
        .slice(0, Number(params?.limit ?? 50));

      return {
        items,
        page_info: { next_cursor: null, previous_cursor: null },
        summary: { count: items.length, income: '0.00', expense: '0.00' },
        day_totals: [],
      };
    }
    if (resource === 'transactions' && method === 'GET') return spaceDb.transactions.map((row) => toRow(spaceDb, row));
    if (resource === 'transactions' && method === 'POST') {
      const row = {
        id: `tx-${spaceDb.transactions.length + 1}`,
        kind: TransactionKind.REGULAR,
        version: 1,
        description: null,
        ...data,
      } as SpaceDb['transactions'][0];

      spaceDb.transactions.push(row);

      return { transaction: toRow(spaceDb, row), wallet: { ...spaceDb.wallets[0], ...STAMPS }, previous_balance: 0 };
    }

    throw new Error(`Unhandled ${method} ${url}`);
  };

  return { db, handle };
};

let backend: ReturnType<typeof createBackend>;

// A copy, like a real response: the cache freezes what it stores, and the backend keeps mutating its rows.
const respond = (config: RequestConfig) =>
  Promise.resolve({ data: JSON.parse(JSON.stringify(backend.handle(config) ?? null)) });
// Lets a test hold chosen responses and settle them later, in any order.
let intercept: (config: RequestConfig) => Promise<{ data: unknown }> | undefined;

beforeEach(() => {
  jest.clearAllMocks();
  backend = createBackend();
  intercept = () => undefined;
  mockedRequest.mockImplementation((config: RequestConfig) => intercept(config) ?? respond(config));
});

const getRequests = () =>
  mockedRequest.mock.calls
    .map(([config]: [RequestConfig]) => config)
    .filter(({ method = 'GET' }) => method === 'GET')
    .map(({ url, params }) => (params ? `${url}?${params.from}` : url));

// What a signed-in user has mounted: the navigator gate, Home, History and the Limits/Categories data.
const useMountedScreens = () => {
  const isSignedIn = useAppSelector((state) => state.auth.isSignedIn);
  const spaceArg = useSpaceArg();

  return {
    gate: useLoadInitData({ isSignedIn }),
    home: useGetRecentTransactionsQuery(useRecentArg()),
    history: useTransactionsData({ range: getCurrentMonthRange(), filter: null }),
    wallets: useGetWalletsQuery(spaceArg),
    categories: useGetCategoriesQuery(spaceArg),
    limits: useGetLimitsQuery(spaceArg),
  };
};

const signIn = (store: ReturnType<typeof createAppStore>) =>
  store.dispatch(loginMe.fulfilled('token', 'req-login', { email: 'me@example.com', password: 'password1' }));

// Mutations invalidate and store notifications flush on timers, so let those run before and after the refetches.
const settle = (store: ReturnType<typeof createAppStore>) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(50);
    await Promise.all(store.dispatch(transactionApi.util.getRunningQueriesThunk()));
    await jest.advanceTimersByTimeAsync(50);
  });

const renderApp = async () => {
  const store = createAppStore();
  const gateLog: boolean[] = [];

  signIn(store);

  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const rendered = renderHook(
    () => {
      const screens = useMountedScreens();

      gateLog.push(screens.gate.isLoading);

      return screens;
    },
    { wrapper },
  );

  await waitFor(() => expect(rendered.result.current.gate.isLoading).toBe(false));
  await settle(store);

  return { store, gateLog, ...rendered };
};
describe('server data scenarios', () => {
  it('drops an archived category from its limit right away', async () => {
    const { store, result, unmount } = await renderApp();

    expect(result.current.limits.currentData?.categoryLimits[0].categories.map(({ id }) => id)).toEqual([5]);

    await act(async () => {
      await store.dispatch(
        categoryApi.endpoints.updateCategory.initiate({ spaceId: 1, categoryId: 5, data: { is_active: 0 } }),
      );
    });
    await settle(store);

    expect(result.current.limits.currentData?.categoryLimits[0].categories).toEqual([]);
    expect(result.current.categories.currentData?.archived.map(({ id }) => id)).toEqual([5]);

    unmount();
  });

  it("moves a category's limit badge when the limit changes", async () => {
    const { store, result, unmount } = await renderApp();

    await act(async () => {
      await store.dispatch(
        limitApi.endpoints.updateLimit.initiate({ spaceId: 1, limitId: 10, data: { category_ids: [6] } }),
      );
    });
    await settle(store);

    const byId = Object.fromEntries(result.current.categories.currentData!.expenses.map((item) => [item.id, item]));

    expect(byId[5].limit).toBeNull();
    expect(byId[6].limit).toEqual({ id: 10, name: null });

    unmount();
  });

  it('shows a saved transaction on Home and History, with one request for the records Home and the gate share', async () => {
    const { store, result, unmount } = await renderApp();

    mockedRequest.mockClear();
    await act(async () => {
      await store.dispatch(
        transactionApi.endpoints.createTransaction.initiate({
          spaceId: 1,
          idempotencyKey: 'key-1',
          data: {
            wallet_id: 1,
            category_id: 5,
            transaction_type: TransactionType.EXPENSE,
            amount: '12',
            timestamp: '2026-01-15T10:00:00.000Z',
          },
        }),
      );
    });
    await settle(store);

    const feedRequests = getRequests()
      .filter((request) => request.startsWith('/spaces/1/transactions/feed?'))
      .map((request) => request.split('?')[1].slice(0, 7))
      .sort();

    expect(feedRequests).toEqual(['1970-01', '2026-01']);
    expect(result.current.home.currentData?.items.map(({ id }) => id)).toEqual(['tx-1']);
    expect(result.current.history.transactions.map(({ id }) => id)).toEqual(['tx-1']);

    unmount();
  });

  it('renames a category and a wallet inside the history already on screen', async () => {
    backend.db(1).transactions.push({
      id: 'tx-1',
      kind: TransactionKind.REGULAR,
      version: 1,
      wallet_id: 1,
      category_id: 5,
      transaction_type: TransactionType.EXPENSE,
      amount: '12.00',
      timestamp: '2026-01-10T10:00:00.000Z',
      description: null,
    });

    const { store, result, unmount } = await renderApp();

    await act(async () => {
      await store.dispatch(
        categoryApi.endpoints.updateCategory.initiate({ spaceId: 1, categoryId: 5, data: { name: 'Groceries' } }),
      );
      await store.dispatch(
        walletApi.endpoints.updateWallet.initiate({
          spaceId: 1,
          walletId: 1,
          data: { wallet_name: 'Card', design: AppColor.SLATE },
        }),
      );
    });
    await settle(store);

    const [row] = result.current.history.transactions;

    expect(row.category.name).toBe('Groceries');
    expect(row.wallet?.wallet_name).toBe('Card');

    unmount();
  });

  it('never shows a late response from another space after switching A → B → A', async () => {
    const { store, result, unmount } = await renderApp();
    const held: (() => void)[] = [];

    intercept = (config) =>
      config.url === '/spaces/2/wallets'
        ? new Promise((resolve) => held.push(() => respond(config).then(resolve)))
        : undefined;

    act(() => {
      store.dispatch(activateSpace(2));
    });
    expect(result.current.wallets.currentData).toBeUndefined();

    act(() => {
      store.dispatch(activateSpace(1));
    });
    expect(result.current.wallets.currentData?.wallets[0].wallet.wallet_name).toBe('Wallet of space 1');

    await act(async () => held.forEach((release) => release()));
    await settle(store);

    expect(result.current.wallets.currentData?.wallets[0].wallet.wallet_name).toBe('Wallet of space 1');

    unmount();
  });

  it('never lets a response from before logout reach the next session', async () => {
    const { store, result, unmount } = await renderApp();
    let releaseOld: () => void = () => {};

    backend.db(1).wallets[0].wallet_name = 'Old session';
    intercept = (config) =>
      config.url === '/spaces/1/wallets'
        ? new Promise((resolve) => (releaseOld = () => respond(config).then(resolve)))
        : undefined;
    act(() => {
      store.dispatch(walletApi.util.invalidateTags([{ type: 'Wallets', id: 1 }]));
    });

    await act(async () => {
      await store.dispatch(logoutMe());
    });

    intercept = () => undefined;
    backend.db(1).wallets[0].wallet_name = 'New session';
    act(() => {
      signIn(store);
    });
    await waitFor(() => expect(result.current.wallets.currentData).toBeDefined());

    await act(async () => releaseOld());
    await settle(store);

    expect(result.current.wallets.currentData?.wallets[0].wallet.wallet_name).toBe('New session');

    unmount();
  });

  it('never lets a history page asked for before logout reach the next session', async () => {
    const { store, result, unmount } = await renderApp();
    let releaseOld: (() => void) | null = null;

    backend.db(1).transactions.push({
      ...{
        id: 'tx-1',
        kind: TransactionKind.REGULAR,
        version: 1,
        wallet_id: 1,
        category_id: 5,
        transaction_type: TransactionType.EXPENSE,
        amount: '12.00',
        timestamp: '2026-01-10T10:00:00.000Z',
        description: null,
      },
      description: 'Old session',
    });
    intercept = (config) =>
      config.url === '/spaces/1/transactions/feed' && !config.params?.from.startsWith('1970')
        ? new Promise((resolve) => (releaseOld = () => respond(config).then(resolve)))
        : undefined;
    act(() => {
      store.dispatch(transactionApi.util.invalidateTags([{ type: 'Transactions', id: 1 }]));
    });
    // The held page is still out, so this waits on timers only, not on running queries.
    await act(async () => jest.advanceTimersByTimeAsync(50));
    expect(releaseOld).not.toBeNull();

    await act(async () => {
      await store.dispatch(logoutMe());
    });

    intercept = () => undefined;
    backend.db(1).transactions[0].description = 'New session';
    act(() => {
      signIn(store);
    });
    await waitFor(() => expect(result.current.history.transactions).toHaveLength(1));

    await act(async () => releaseOld?.());
    await settle(store);

    expect(result.current.history.transactions[0].description).toBe('New session');

    unmount();
  });

  it('reads the history again after a return to the app, one page and no more', async () => {
    backend.db(1).transactions.push({
      id: 'tx-1',
      kind: TransactionKind.REGULAR,
      version: 1,
      wallet_id: 1,
      category_id: 5,
      transaction_type: TransactionType.EXPENSE,
      amount: '12.00',
      timestamp: '2026-01-10T10:00:00.000Z',
      description: null,
    });
    const { store, result, unmount } = await renderApp();
    expect(result.current.history.transactions.map(({ id }) => id)).toEqual(['tx-1']);

    backend.db(1).transactions[0].amount = '30.00';
    mockedRequest.mockClear();
    act(() => {
      store.dispatch(refreshSpaceData({ force: true }));
    });
    await settle(store);

    const historyRequests = getRequests().filter((request) => request.startsWith('/spaces/1/transactions/feed?2026'));
    expect(historyRequests).toHaveLength(1);
    expect(result.current.history.transactions[0].amount).toBe('30.00');

    unmount();
  });

  it('never asks for a whole period through the old transactions list', async () => {
    const { store, unmount } = await renderApp();

    await act(async () => {
      await store.dispatch(
        transactionApi.endpoints.createTransaction.initiate({
          spaceId: 1,
          idempotencyKey: 'key-1',
          data: {
            wallet_id: 1,
            category_id: 5,
            transaction_type: TransactionType.EXPENSE,
            amount: '12',
            timestamp: '2026-01-15T10:00:00.000Z',
          },
        }),
      );
    });
    act(() => {
      store.dispatch(refreshSpaceData({ force: true }));
      store.dispatch(activateSpace(2));
    });
    await settle(store);

    const gets = mockedRequest.mock.calls
      .map(([config]: [RequestConfig]) => config)
      .filter(({ method = 'GET' }) => method === 'GET');
    expect(gets.some(({ url }) => /^\/spaces\/\d+\/transactions$/.test(url))).toBe(false);
    expect(gets.some(({ url }) => url.endsWith('/transactions/feed'))).toBe(true);

    unmount();
  });

  it('keeps data and navigation through a failed background refresh', async () => {
    const { store, result, gateLog, unmount } = await renderApp();
    const openedAt = gateLog.indexOf(false);

    mockedRequest.mockImplementation((config: RequestConfig) =>
      (config.method ?? 'GET') === 'GET'
        ? Promise.reject({ response: { data: { statusCode: 500, message: 'boom' } } })
        : respond(config),
    );
    await act(async () => {
      await store.dispatch(
        walletApi.endpoints.updateWallet.initiate({
          spaceId: 1,
          walletId: 1,
          data: { wallet_name: 'Card', design: AppColor.SLATE },
        }),
      );
    });
    await settle(store);

    expect(result.current.wallets.isError).toBe(true);
    expect(result.current.wallets.currentData?.wallets).toHaveLength(1);
    expect(getLoadState(result.current.wallets)).toEqual({ isLoading: false, hasError: false, hasRefreshError: true });
    expect(result.current.history.viewState).toBe('trueEmpty');
    expect(gateLog.slice(openedAt)).not.toContain(true);

    unmount();
  });
});
