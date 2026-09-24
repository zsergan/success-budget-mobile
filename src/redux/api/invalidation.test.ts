import { createAppStore } from '@redux/Store';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { categoryApi } from '@redux/state/category/api';
import { limitApi } from '@redux/state/limit/api';
import { transactionApi } from '@redux/state/transaction/api';
import { walletApi } from '@redux/state/wallet/api';
import { AppColor, TransactionType } from '@shared/enums';
import { baseApi } from './baseApi';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

// RTK Query batches store notifications on an animation frame, which would otherwise fire after teardown.
jest.useFakeTimers();

interface RequestConfig {
  url: string;
  method: string;
  params?: { from?: string };
}

let mutationResponse: unknown;
let mutationFails: boolean;

const respond = ({ url, method }: RequestConfig) => {
  if (method !== 'GET' && mutationFails) throw { response: { data: { statusCode: 400, message: 'Rejected' } } };
  if (method !== 'GET') return { data: mutationResponse };
  if (url.endsWith('/wallets'))
    return { data: { wallets: [], total_balance: 0, total_balance_currency: 'USD', delta_percent: 0 } };
  if (url.endsWith('/categories')) return { data: { incomes: [], expenses: [], archived: [] } };
  if (url.endsWith('/limits')) return { data: { total: null, categories: [], over_allocation: null } };
  if (url.endsWith('/latest')) return { data: null };

  return { data: [] };
};

const resourceOf = ({ url, params }: RequestConfig) => {
  const [, spaceId, resource, extra] = url.match(/^\/spaces\/(\d+)\/(\w+)(?:\/(\w+))?$/) ?? [];
  const name = extra ?? (resource === 'transactions' ? (params?.from ? 'range' : 'recent') : resource);

  return `${spaceId}:${name}`;
};

const ALL_HISTORY = ['1:recent', '1:range', '1:latest'];

const subscribeToSpace = (store: ReturnType<typeof createAppStore>, spaceId: number) => {
  store.dispatch(walletApi.endpoints.getWallets.initiate({ spaceId }));
  store.dispatch(categoryApi.endpoints.getCategories.initiate({ spaceId }));
  store.dispatch(limitApi.endpoints.getLimits.initiate({ spaceId }));
  store.dispatch(transactionApi.endpoints.getTransactions.initiate({ spaceId }));
  store.dispatch(
    transactionApi.endpoints.getTransactions.initiate({
      spaceId,
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T23:59:59.999Z',
    }),
  );
  store.dispatch(transactionApi.endpoints.getLatestTransaction.initiate({ spaceId }));
};

const refetchedAfter = async (mutate: (store: ReturnType<typeof createAppStore>) => Promise<unknown>) => {
  const store = createAppStore();

  subscribeToSpace(store, 1);
  subscribeToSpace(store, 2);
  await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
  mockedRequest.mockClear();

  await mutate(store);
  await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));

  return mockedRequest.mock.calls
    .map(([config]: [RequestConfig]) => config)
    .filter((config) => config.method === 'GET')
    .map(resourceOf)
    .sort();
};

beforeEach(() => {
  jest.clearAllMocks();
  mutationResponse = undefined;
  mutationFails = false;
  mockedRequest.mockImplementation(async (config: RequestConfig) => respond(config));
});

const transactionData = {
  wallet_id: 1,
  category_id: 1,
  transaction_type: TransactionType.EXPENSE,
  amount: '10',
  timestamp: '2026-01-05T00:00:00.000Z',
};

const walletData = { wallet_name: 'Cash', initial_balance: '0', design: AppColor.SLATE };

const rules = [
  {
    name: 'create transaction',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(transactionApi.endpoints.createTransaction.initiate({ spaceId: 1, data: transactionData })),
    expected: [...ALL_HISTORY, '1:wallets', '1:limits', '1:categories'],
  },
  {
    name: 'create category',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(
        categoryApi.endpoints.createCategory.initiate({
          spaceId: 1,
          data: { name: 'Food', transaction_type: TransactionType.EXPENSE, icon: 'Grocery', color: AppColor.SLATE },
        }),
      ),
    response: { id: 1, name: 'Food', transaction_type: TransactionType.EXPENSE, icon: 'Grocery' },
    expected: ['1:categories'],
  },
  {
    name: 'edit, archive or restore category',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(
        categoryApi.endpoints.updateCategory.initiate({ spaceId: 1, categoryId: 1, data: { is_active: 0 } }),
      ),
    response: { id: 1, name: 'Food', transaction_type: TransactionType.EXPENSE, icon: 'Grocery' },
    expected: [...ALL_HISTORY, '1:categories', '1:limits'],
  },
  {
    name: 'delete category that gets archived',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(categoryApi.endpoints.deleteCategory.initiate({ spaceId: 1, categoryId: 1 })),
    response: { archived: true },
    expected: [...ALL_HISTORY, '1:categories', '1:limits'],
  },
  {
    name: 'delete category that gets removed',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(categoryApi.endpoints.deleteCategory.initiate({ spaceId: 1, categoryId: 1 })),
    response: { archived: false },
    expected: ['1:categories', '1:limits'],
  },
  {
    name: 'reorder categories',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(categoryApi.endpoints.reorderCategories.initiate({ spaceId: 1, categoryIds: [2, 1] })),
    expected: ['1:categories'],
  },
  {
    name: 'create limit',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(
        limitApi.endpoints.createLimit.initiate({ spaceId: 1, data: { amount: '100', category_ids: [1] } }),
      ),
    expected: ['1:categories', '1:limits'],
  },
  {
    name: 'edit limit',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(limitApi.endpoints.updateLimit.initiate({ spaceId: 1, limitId: 1, data: { amount: '200' } })),
    expected: ['1:categories', '1:limits'],
  },
  {
    name: 'delete limit',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(limitApi.endpoints.deleteLimit.initiate({ spaceId: 1, limitId: 1 })),
    expected: ['1:categories', '1:limits'],
  },
  {
    name: 'create wallet without a starting balance',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(walletApi.endpoints.createWallet.initiate({ spaceId: 1, data: walletData })),
    response: { wallet: { id: 1 }, transaction: null },
    expected: ['1:wallets'],
  },
  {
    name: 'create wallet with a starting balance',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(
        walletApi.endpoints.createWallet.initiate({ spaceId: 1, data: { ...walletData, initial_balance: '50' } }),
      ),
    response: { wallet: { id: 1 }, transaction: { id: 'tx' } },
    expected: [...ALL_HISTORY, '1:wallets'],
  },
  {
    name: 'edit wallet',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(
        walletApi.endpoints.updateWallet.initiate({
          spaceId: 1,
          walletId: 1,
          data: { wallet_name: 'Card', design: AppColor.SLATE },
        }),
      ),
    expected: [...ALL_HISTORY, '1:wallets'],
  },
  {
    name: 'delete wallet',
    mutate: (store: ReturnType<typeof createAppStore>) =>
      store.dispatch(walletApi.endpoints.deleteWallet.initiate({ spaceId: 1, walletId: 1 })),
    expected: [...ALL_HISTORY, '1:wallets'],
  },
];

describe('invalidation rules (docs/server-data.md)', () => {
  it.each(rules)(
    '$name refetches exactly its stale resources in the space it ran against',
    async ({ mutate, response, expected }) => {
      mutationResponse = response;

      expect(await refetchedAfter(mutate)).toEqual([...expected].sort());
    },
  );

  it.each(rules)('$name refetches nothing when it fails', async ({ mutate }) => {
    mutationFails = true;

    expect(await refetchedAfter(mutate)).toEqual([]);
  });

  it('treats a success without a response body as a success', async () => {
    mutationResponse = undefined;

    const refetched = await refetchedAfter((store) =>
      store.dispatch(limitApi.endpoints.deleteLimit.initiate({ spaceId: 1, limitId: 1 })),
    );

    expect(refetched).toEqual(['1:categories', '1:limits']);
  });
});

describe('session isolation', () => {
  it("never lets a mutation from an ended session refresh the next session's cache", async () => {
    const store = createAppStore();
    let finishOldMutation: (value: unknown) => void = () => {};

    const signIn = () =>
      store.dispatch(loginMe.fulfilled('token', 'req-login', { email: 'me@example.com', password: 'password1' }));

    signIn();
    mockedRequest.mockImplementationOnce(() => new Promise((resolve) => (finishOldMutation = resolve)));
    const oldMutation = store.dispatch(
      transactionApi.endpoints.createTransaction.initiate({ spaceId: 1, data: transactionData }),
    );

    await store.dispatch(logoutMe());
    signIn();
    subscribeToSpace(store, 1);
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    mockedRequest.mockClear();

    finishOldMutation({ data: { transaction: { id: 'late' } } });
    await oldMutation;
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));

    expect(mockedRequest).not.toHaveBeenCalled();
  });
});
