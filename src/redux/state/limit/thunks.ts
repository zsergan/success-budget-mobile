import { createAsyncThunk } from '@reduxjs/toolkit';

import type { CreateLimitRequest, UpdateLimitRequest } from '@api/dto';
import { getLimits, createLimit, updateLimit } from '@api/limit.api';

export const fetchLimits = createAsyncThunk('limit/fetchLimits', async () => await getLimits());

export const addLimit = createAsyncThunk(
  'limit/addLimit',
  async (data: CreateLimitRequest, thunkAPI) => await createLimit(data).then(() => thunkAPI.dispatch(fetchLimits())),
);

export const editLimit = createAsyncThunk(
  'limit/editLimit',
  async (data: { limitId: number; limitData: UpdateLimitRequest }, thunkAPI) =>
    await updateLimit(data.limitId, data.limitData).then(() => thunkAPI.dispatch(fetchLimits())),
);
