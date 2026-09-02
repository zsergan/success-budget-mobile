import type { AxiosError } from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

import type { ErrorResponse } from '@api/dto';

export const createAppAsyncThunk = createAsyncThunk.withTypes<{ rejectValue: ErrorResponse | undefined }>();

export const getRejectValue = (error: unknown) => (error as AxiosError<ErrorResponse>).response?.data;
