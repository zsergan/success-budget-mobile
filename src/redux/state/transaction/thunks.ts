import type { CreateTransactionRequest } from '@api/dto';
import { getTransactions, createTransaction } from '@api/transaction.api';
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

export const addTransaction = createAppAsyncThunk(
  'transaction/addTransaction',
  async (payload: CreateTransactionRequest, thunkAPI) => {
    try {
      const response = await createTransaction(payload);

      thunkAPI.dispatch(fetchTransactions());
      thunkAPI.dispatch(fetchWallets());
      thunkAPI.dispatch(fetchLimits());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);
