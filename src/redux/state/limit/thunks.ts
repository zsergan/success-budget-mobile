import type { CreateLimitRequest, UpdateLimitRequest } from '@api/dto';
import { getLimits, createLimit, updateLimit } from '@api/limit.api';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

export const fetchLimits = createAppAsyncThunk('limit/fetchLimits', async (_: void, thunkAPI) => {
  try {
    return await getLimits();
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const addLimit = createAppAsyncThunk('limit/addLimit', async (data: CreateLimitRequest, thunkAPI) => {
  try {
    const response = await createLimit(data);

    thunkAPI.dispatch(fetchLimits());

    return response;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const editLimit = createAppAsyncThunk(
  'limit/editLimit',
  async (data: { limitId: number; limitData: UpdateLimitRequest }, thunkAPI) => {
    try {
      const response = await updateLimit(data.limitId, data.limitData);

      thunkAPI.dispatch(fetchLimits());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);
