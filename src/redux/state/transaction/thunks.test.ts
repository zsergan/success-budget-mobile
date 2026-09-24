import { createAppStore } from '@redux/Store';
import * as transactionApi from '@api/transaction.api';
import * as walletApi from '@api/wallet.api';
import { TransactionType } from '@shared/enums';
import { activateSpace } from '../space/thunks';
import { addTransaction } from './thunks';

jest.mock('@api/transaction.api');
jest.mock('@api/wallet.api');

const mockedCreateTransaction = jest.mocked(transactionApi.createTransaction);
const mockedGetTransactions = jest.mocked(transactionApi.getTransactions);
const mockedGetLatestTransaction = jest.mocked(transactionApi.getLatestTransaction);
const mockedGetWallets = jest.mocked(walletApi.getWallets);

const createTestStore = () => createAppStore();

const payload = {
  wallet_id: 1,
  category_id: 1,
  transaction_type: TransactionType.EXPENSE,
  amount: '10.00',
  timestamp: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetTransactions.mockResolvedValue([]);
  mockedGetLatestTransaction.mockResolvedValue(null);
  mockedGetWallets.mockResolvedValue({
    wallets: [],
    total_balance: 0,
    total_balance_currency: 'USD',
    delta_percent: 0,
  });
});

describe('addTransaction', () => {
  it('refreshes recent/wallets and bumps dataRevision when the space is unchanged', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    mockedCreateTransaction.mockResolvedValue({ id: 'tx-1' } as never);

    await store.dispatch(addTransaction(payload));

    expect(mockedGetTransactions).toHaveBeenCalledWith(1);
    expect(mockedGetWallets).toHaveBeenCalledWith(1);
    expect(store.getState().transaction.dataRevision).toBe(1);
  });

  it('does not fetch latest itself -- that refresh is solely owned by useTransactionsData watching dataRevision', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    mockedCreateTransaction.mockResolvedValue({ id: 'tx-1' } as never);

    await store.dispatch(addTransaction(payload));

    expect(mockedGetLatestTransaction).not.toHaveBeenCalled();
  });

  it('a mutation in the old space must not refresh the newly selected space', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));

    let resolveCreate!: (value: Awaited<ReturnType<typeof transactionApi.createTransaction>>) => void;
    mockedCreateTransaction.mockReturnValue(new Promise((resolve) => (resolveCreate = resolve)));

    const pending = store.dispatch(addTransaction(payload));

    store.dispatch(activateSpace(2));
    resolveCreate({ id: 'old-space-tx' } as never);
    await pending;

    expect(mockedGetTransactions).not.toHaveBeenCalledWith(2);
    expect(mockedGetWallets).not.toHaveBeenCalledWith(2);
    expect(store.getState().transaction.dataRevision).toBe(0);
  });
});
