import { createAsyncThunk } from '@reduxjs/toolkit';

import type { CreateWalletRequest, UpdateWalletRequest } from '@api/dto';
import { getWallets, createWallet, updateWallet, deleteWallet } from '@api/wallet.api';

export const fetchWallets = createAsyncThunk('wallet/fetchWallets', async () => {
  return await getWallets();
});

export const addWallet = createAsyncThunk('wallet/addWallet', async (data: CreateWalletRequest, thunkAPI) => {
  return await createWallet(data).then(() => {
    thunkAPI.dispatch(fetchWallets());
  });
});

export const editWallet = createAsyncThunk(
  'wallet/editWallet',
  async (data: { walletId: number; walletData: UpdateWalletRequest }, thunkAPI) => {
    return await updateWallet(data.walletId, data.walletData).then(() => {
      thunkAPI.dispatch(fetchWallets());
    });
  },
);

export const removeWallet = createAsyncThunk('wallet/removeWallet', async (walletId: number, thunkAPI) => {
  return await deleteWallet(walletId).then(() => {
    thunkAPI.dispatch(fetchWallets());
  });
});
