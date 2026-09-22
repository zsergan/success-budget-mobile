import type { CreateWalletRequest, UpdateWalletRequest } from '@api/dto';
import { getWallets, createWallet, updateWallet, deleteWallet } from '@api/wallet.api';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

import { isSpaceContextCurrent } from '../space/thunks';
import { transactionsInvalidated } from '../transaction/actions';

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
  const { currentSpaceId: spaceId, contextKey } = thunkAPI.getState().space;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    const response = await createWallet(spaceId, data);

    if (isSpaceContextCurrent(thunkAPI.getState, contextKey)) {
      thunkAPI.dispatch(fetchWallets());

      // A positive starting balance creates a real transaction on the
      // backend -- history needs to know about it too, not just the
      // wallet list.
      if (response.transaction) {
        thunkAPI.dispatch(transactionsInvalidated({ contextKey }));
      }
    }

    return response;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const editWallet = createAppAsyncThunk(
  'wallet/editWallet',
  async (data: { walletId: number; walletData: UpdateWalletRequest }, thunkAPI) => {
    const { currentSpaceId: spaceId, contextKey } = thunkAPI.getState().space;

    if (spaceId === null) {
      return thunkAPI.rejectWithValue(undefined);
    }

    try {
      const response = await updateWallet(spaceId, data.walletId, data.walletData);

      if (isSpaceContextCurrent(thunkAPI.getState, contextKey)) {
        thunkAPI.dispatch(fetchWallets());
        // The wallet's name/design changed, which is embedded in every
        // already-loaded transaction row that references it.
        thunkAPI.dispatch(transactionsInvalidated({ contextKey }));
      }

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);

export const removeWallet = createAppAsyncThunk('wallet/removeWallet', async (walletId: number, thunkAPI) => {
  const { currentSpaceId: spaceId, contextKey } = thunkAPI.getState().space;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    await deleteWallet(spaceId, walletId);

    if (isSpaceContextCurrent(thunkAPI.getState, contextKey)) {
      thunkAPI.dispatch(fetchWallets());
      // Already-loaded transaction rows for this wallet need to pick up
      // wallet: null (deleted), same as a fresh fetch would return.
      thunkAPI.dispatch(transactionsInvalidated({ contextKey }));
    }
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});
