import type { AxiosError } from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

import type { CreateTransactionRequest, ErrorResponse } from '@api/dto';
import { getTransactions, createTransaction } from '@api/transaction.api';

import { fetchLimits } from '../limit/thunks';
import { fetchWallets } from '../wallet/thunks';

export const fetchTransactions = createAsyncThunk('transaction/fetchTransactions', async () => {
  return await getTransactions();
});

export const addTransaction = createAsyncThunk(
  'transaction/addTransaction',
  async (payload: CreateTransactionRequest, thunkAPI) => {
    try {
      const response = await createTransaction(payload);

      thunkAPI.dispatch(fetchTransactions());
      thunkAPI.dispatch(fetchWallets());
      thunkAPI.dispatch(fetchLimits());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue((error as AxiosError<ErrorResponse>).response?.data);
    }
  },
);
