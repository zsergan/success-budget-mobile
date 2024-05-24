import { createAsyncThunk } from '@reduxjs/toolkit';

import type { CreateTransactionRequest } from '@api/dto';
import { getTransactions, createTransaction } from '@api/transaction.api';

import { fetchWallets } from '../wallet/thunks';

export const fetchTransactions = createAsyncThunk('transaction/fetchTransactions', async () => {
  return await getTransactions();
});

export const addTransaction = createAsyncThunk(
  'transaction/addTransaction',
  async (payload: CreateTransactionRequest, thunkAPI) => {
    return await createTransaction(payload).then(() => {
      thunkAPI.dispatch(fetchTransactions());
      thunkAPI.dispatch(fetchWallets());
    });
  },
);
