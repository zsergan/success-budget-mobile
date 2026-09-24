import type { CreateTransactionRequest } from '@api/dto';
import { getTransactions, createTransaction, getLatestTransaction } from '@api/transaction.api';
import { baseApi, spaceTags } from '@redux/api/baseApi';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

import { isSpaceContextCurrent } from '../space/thunks';
import { fetchLimits } from '../limit/thunks';
import { fetchWallets } from '../wallet/thunks';
import { transactionsInvalidated } from './actions';

export const fetchTransactions = createAppAsyncThunk('transaction/fetchTransactions', async (_: void, thunkAPI) => {
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    return await getTransactions(spaceId);
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const fetchTransactionsInRange = createAppAsyncThunk(
  'transaction/fetchTransactionsInRange',
  async (params: { from: Date; to: Date }, thunkAPI) => {
    const spaceId = thunkAPI.getState().space.currentSpaceId;

    if (spaceId === null) {
      return thunkAPI.rejectWithValue(undefined);
    }

    try {
      return await getTransactions(spaceId, params);
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);

export const fetchLatestTransaction = createAppAsyncThunk(
  'transaction/fetchLatestTransaction',
  async (_: void, thunkAPI) => {
    const spaceId = thunkAPI.getState().space.currentSpaceId;

    if (spaceId === null) {
      return thunkAPI.rejectWithValue(undefined);
    }

    try {
      return await getLatestTransaction(spaceId);
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);

export const addTransaction = createAppAsyncThunk(
  'transaction/addTransaction',
  async (payload: CreateTransactionRequest, thunkAPI) => {
    const { currentSpaceId: spaceId, contextKey } = thunkAPI.getState().space;

    if (spaceId === null) {
      return thunkAPI.rejectWithValue(undefined);
    }

    try {
      const response = await createTransaction(spaceId, payload);

      thunkAPI.dispatch(baseApi.util.invalidateTags(spaceTags(spaceId, 'Categories')));

      // The user may have switched (or logged out of) this space while the
      // create was in flight. The space that's now active already has its
      // own fresh data (or will, via its own activation) -- refreshing it,
      // or marking its history dirty, for a mutation that ran against a
      // different space would be wrong, not just redundant.
      if (isSpaceContextCurrent(thunkAPI.getState, contextKey)) {
        thunkAPI.dispatch(fetchTransactions());
        thunkAPI.dispatch(fetchWallets());
        thunkAPI.dispatch(fetchLimits());
        // latest's own refresh is owned solely by useTransactionsData's
        // dataRevision-watching effect (dispatching it here too, on top of
        // that, used to double-fetch it on every add) -- this only needs
        // to mark it (and range) dirty.
        thunkAPI.dispatch(transactionsInvalidated({ contextKey }));
      }

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);
