import type { AxiosError } from 'axios';
import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

import type { ErrorResponse } from '@api/dto';
import type { RootState } from '@redux/Store';
import { NETWORK_ERROR_MESSAGE } from '@shared/utils/error';

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  rejectValue: ErrorResponse | undefined;
}>();

// Retry-After is delay-seconds or an HTTP-date; without a usable one callers use their default cooldown.
const parseRetryAfterMs = (header: unknown): number | undefined => {
  if (typeof header !== 'string' || header.trim() === '') return undefined;

  const seconds = Number(header);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const dateMs = Date.parse(header);

  return Number.isNaN(dateMs) ? undefined : Math.max(0, dateMs - Date.now());
};

// Must stay truthy: the base query returns it as `error`, and a falsy one reads as success.
const networkError = (transport: ErrorResponse['transport']): ErrorResponse => ({
  message: NETWORK_ERROR_MESSAGE,
  path: '',
  statusCode: 0,
  timestamp: new Date().toISOString(),
  transport,
});

const transportOf = (error: AxiosError): ErrorResponse['transport'] => {
  if (axios.isCancel(error)) return 'canceled';

  return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' ? 'timeout' : 'network';
};

export const getRejectValue = (error: unknown): ErrorResponse => {
  const axiosError = error as AxiosError<ErrorResponse>;
  const data = axiosError.response?.data;

  if (!data) return networkError(transportOf(axiosError));

  const retryAfterMs = parseRetryAfterMs(axiosError.response?.headers?.['retry-after']);

  return retryAfterMs === undefined ? data : { ...data, retryAfterMs };
};
