import type { CreateLimitRequest, UpdateLimitRequest } from '@api/dto';
import { getLimits, createLimit, updateLimit, deleteLimit } from '@api/limit.api';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

export const fetchLimits = createAppAsyncThunk('limit/fetchLimits', async (_: void, thunkAPI) => {
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    return await getLimits(spaceId);
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const addLimit = createAppAsyncThunk('limit/addLimit', async (data: CreateLimitRequest, thunkAPI) => {
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    const response = await createLimit(spaceId, data);

    thunkAPI.dispatch(fetchLimits());

    return response;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const editLimit = createAppAsyncThunk(
  'limit/editLimit',
  async (data: { limitId: number; limitData: UpdateLimitRequest }, thunkAPI) => {
    const spaceId = thunkAPI.getState().space.currentSpaceId;

    if (spaceId === null) {
      return thunkAPI.rejectWithValue(undefined);
    }

    try {
      const response = await updateLimit(spaceId, data.limitId, data.limitData);

      thunkAPI.dispatch(fetchLimits());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);

export const removeLimit = createAppAsyncThunk('limit/removeLimit', async (limitId: number, thunkAPI) => {
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    await deleteLimit(spaceId, limitId);

    thunkAPI.dispatch(fetchLimits());
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});
