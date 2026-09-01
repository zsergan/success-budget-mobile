import type { AxiosError } from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

import type { CreateWalletRequest, ErrorResponse, UpdateWalletRequest } from '@api/dto';
import { getWallets, createWallet, updateWallet, deleteWallet } from '@api/wallet.api';

export const fetchWallets = createAsyncThunk('wallet/fetchWallets', async () => {
  return await getWallets();
});

export const addWallet = createAsyncThunk('wallet/addWallet', async (data: CreateWalletRequest, thunkAPI) => {
  try {
    const response = await createWallet(data);

    thunkAPI.dispatch(fetchWallets());

    return response;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue((error as AxiosError<ErrorResponse>).response?.data);
  }
});

export const editWallet = createAsyncThunk(
  'wallet/editWallet',
  async (data: { walletId: number; walletData: UpdateWalletRequest }, thunkAPI) => {
    try {
      const response = await updateWallet(data.walletId, data.walletData);

      thunkAPI.dispatch(fetchWallets());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue((error as AxiosError<ErrorResponse>).response?.data);
    }
  },
);

export const removeWallet = createAsyncThunk('wallet/removeWallet', async (walletId: number, thunkAPI) => {
  return await deleteWallet(walletId).then(() => {
    thunkAPI.dispatch(fetchWallets());
  });
});
