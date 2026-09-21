import { configureStore } from '@reduxjs/toolkit';

import * as walletApi from '@api/wallet.api';
import { AppColor } from '@shared/enums';
import authReducer from '../auth/slice';
import categoryReducer from '../category/slice';
import currencyReducer from '../currency/slice';
import limitReducer from '../limit/slice';
import memberReducer from '../member/slice';
import profileReducer from '../profile/slice';
import { activateSpace } from '../space/thunks';
import spaceReducer from '../space/slice';
import transactionReducer from '../transaction/slice';
import walletReducer from './slice';
import { addWallet } from './thunks';

jest.mock('@api/wallet.api');

const mockedCreateWallet = jest.mocked(walletApi.createWallet);
const mockedGetWallets = jest.mocked(walletApi.getWallets);

const testReducer = {
  auth: authReducer,
  category: categoryReducer,
  currency: currencyReducer,
  limit: limitReducer,
  member: memberReducer,
  profile: profileReducer,
  space: spaceReducer,
  transaction: transactionReducer,
  wallet: walletReducer,
};

const createTestStore = () => configureStore({ reducer: testReducer });

const payload = { wallet_name: 'Cash', initial_balance: '0', design: AppColor.SLATE };

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetWallets.mockResolvedValue({
    wallets: [],
    total_balance: 0,
    total_balance_currency: 'USD',
    delta_percent: 0,
  });
});

describe('addWallet', () => {
  it('bumps transaction.dataRevision when a starting balance creates a transaction', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    mockedCreateWallet.mockResolvedValue({
      wallet: { id: 10, wallet_name: 'Cash', balance: '100', design: AppColor.SLATE },
      transaction: { id: 'starting-balance' } as never,
    });

    await store.dispatch(addWallet({ ...payload, initial_balance: '100' }));

    expect(store.getState().transaction.dataRevision).toBe(1);
  });

  it('does not bump transaction.dataRevision for a zero-balance wallet (no transaction created)', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));
    mockedCreateWallet.mockResolvedValue({
      wallet: { id: 10, wallet_name: 'Cash', balance: '0', design: AppColor.SLATE },
      transaction: null,
    });

    await store.dispatch(addWallet(payload));

    expect(store.getState().transaction.dataRevision).toBe(0);
  });

  it('does not refresh wallets or invalidate history for a space the user has since left', async () => {
    const store = createTestStore();

    store.dispatch(activateSpace(1));

    let resolveCreate!: (value: Awaited<ReturnType<typeof walletApi.createWallet>>) => void;
    mockedCreateWallet.mockReturnValue(new Promise((resolve) => (resolveCreate = resolve)));

    const pending = store.dispatch(addWallet({ ...payload, initial_balance: '100' }));

    store.dispatch(activateSpace(2));
    resolveCreate({
      wallet: { id: 10, wallet_name: 'Cash', balance: '100', design: AppColor.SLATE },
      transaction: { id: 'starting-balance' } as never,
    });
    await pending;

    expect(mockedGetWallets).not.toHaveBeenCalledWith(2);
    expect(store.getState().transaction.dataRevision).toBe(0);
  });
});
