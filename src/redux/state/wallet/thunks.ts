import type { CreateWalletRequest, UpdateWalletRequest } from '@api/dto';
import { getWallets, createWallet, updateWallet, deleteWallet } from '@api/wallet.api';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

export const fetchWallets = createAppAsyncThunk('wallet/fetchWallets', async (_: void, thunkAPI) => {
  try {
    return await getWallets();
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const addWallet = createAppAsyncThunk('wallet/addWallet', async (data: CreateWalletRequest, thunkAPI) => {
  try {
    const response = await createWallet(data);

    thunkAPI.dispatch(fetchWallets());

    return response;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const editWallet = createAppAsyncThunk(
  'wallet/editWallet',
  async (data: { walletId: number; walletData: UpdateWalletRequest }, thunkAPI) => {
    try {
      const response = await updateWallet(data.walletId, data.walletData);

      thunkAPI.dispatch(fetchWallets());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);

export const removeWallet = createAppAsyncThunk('wallet/removeWallet', async (walletId: number, thunkAPI) => {
  try {
    await deleteWallet(walletId);

    thunkAPI.dispatch(fetchWallets());
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});
