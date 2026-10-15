import { createAsyncThunk } from '@reduxjs/toolkit';

import type { ErrorResponse } from '@api/dto';
import type { RootState } from '@redux/Store';

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  rejectValue: ErrorResponse | undefined;
}>();
