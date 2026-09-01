import type { AxiosError } from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

import type { CreateLimitRequest, ErrorResponse, UpdateLimitRequest } from '@api/dto';
import { getLimits, createLimit, updateLimit } from '@api/limit.api';

export const fetchLimits = createAsyncThunk('limit/fetchLimits', async () => await getLimits());

export const addLimit = createAsyncThunk('limit/addLimit', async (data: CreateLimitRequest, thunkAPI) => {
  try {
    const response = await createLimit(data);

    thunkAPI.dispatch(fetchLimits());

    return response;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue((error as AxiosError<ErrorResponse>).response?.data);
  }
});

export const editLimit = createAsyncThunk(
  'limit/editLimit',
  async (data: { limitId: number; limitData: UpdateLimitRequest }, thunkAPI) => {
    try {
      const response = await updateLimit(data.limitId, data.limitData);

      thunkAPI.dispatch(fetchLimits());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue((error as AxiosError<ErrorResponse>).response?.data);
    }
  },
);
