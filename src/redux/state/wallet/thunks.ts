import type { CreateWalletRequest, UpdateWalletRequest } from '@api/dto';
import { getWallets, createWallet, updateWallet, deleteWallet } from '@api/wallet.api';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

export const fetchWallets = createAppAsyncThunk('wallet/fetchWallets', async (_: void, thunkAPI) => {
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    return await getWallets(spaceId);
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const addWallet = createAppAsyncThunk('wallet/addWallet', async (data: CreateWalletRequest, thunkAPI) => {
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    const response = await createWallet(spaceId, data);

    thunkAPI.dispatch(fetchWallets());

    return response;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const editWallet = createAppAsyncThunk(
  'wallet/editWallet',
  async (data: { walletId: number; walletData: UpdateWalletRequest }, thunkAPI) => {
    const spaceId = thunkAPI.getState().space.currentSpaceId;

    if (spaceId === null) {
      return thunkAPI.rejectWithValue(undefined);
    }

    try {
      const response = await updateWallet(spaceId, data.walletId, data.walletData);

      thunkAPI.dispatch(fetchWallets());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);

export const removeWallet = createAppAsyncThunk('wallet/removeWallet', async (walletId: number, thunkAPI) => {
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    await deleteWallet(spaceId, walletId);

    thunkAPI.dispatch(fetchWallets());
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});
