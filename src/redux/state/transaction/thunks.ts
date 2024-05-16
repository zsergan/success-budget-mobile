import { createAsyncThunk } from '@reduxjs/toolkit';

import type { CreateTransactionRequest } from '@api/dto';
import { getTransactions, createTransaction } from '@api/transaction.api';

import { fetchHoldings } from '../holding/thunks';

export const fetchTransactions = createAsyncThunk('transaction/fetchTransactions', async (holdingId: number) => {
  return await getTransactions(holdingId);
});

export const addTransaction = createAsyncThunk(
  'transaction/addTransaction',
  async (payload: CreateTransactionRequest, thunkAPI) => {
    return await createTransaction(payload).then((response) => {
      thunkAPI.dispatch(fetchTransactions(response.holding_id));
      thunkAPI.dispatch(fetchHoldings());
    });
  },
);
