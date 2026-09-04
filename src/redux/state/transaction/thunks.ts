import type { CreateTransactionRequest } from '@api/dto';
import { getTransactions, createTransaction, getLatestTransaction } from '@api/transaction.api';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

import { fetchLimits } from '../limit/thunks';
import { fetchWallets } from '../wallet/thunks';

export const fetchTransactions = createAppAsyncThunk('transaction/fetchTransactions', async (_: void, thunkAPI) => {
  try {
    return await getTransactions();
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const fetchTransactionsInRange = createAppAsyncThunk(
  'transaction/fetchTransactionsInRange',
  async (params: { from: Date; to: Date }, thunkAPI) => {
    try {
      return await getTransactions(params);
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);

export const fetchLatestTransaction = createAppAsyncThunk(
  'transaction/fetchLatestTransaction',
  async (_: void, thunkAPI) => {
    try {
      return await getLatestTransaction();
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);

export const addTransaction = createAppAsyncThunk(
  'transaction/addTransaction',
  async (payload: CreateTransactionRequest, thunkAPI) => {
    try {
      const response = await createTransaction(payload);

      thunkAPI.dispatch(fetchTransactions());
      thunkAPI.dispatch(fetchWallets());
      thunkAPI.dispatch(fetchLimits());
      thunkAPI.dispatch(fetchLatestTransaction());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);
