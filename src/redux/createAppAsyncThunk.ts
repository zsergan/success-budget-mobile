import type { AxiosError } from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

import type { ErrorResponse } from '@api/dto';
import type { RootState } from '@redux/Store';
import { NETWORK_ERROR_MESSAGE } from '@shared/utils/error';

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  rejectValue: ErrorResponse | undefined;
}>();

// Retry-After is either delay-seconds ("120") or an HTTP-date
// ("Wed, 21 Oct 2026 07:28:00 GMT"); an absent or malformed header isn't an
// error on its own -- callers just fall back to their own default cooldown.
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
const networkError = (): ErrorResponse => ({
  message: NETWORK_ERROR_MESSAGE,
  path: '',
  statusCode: 0,
  timestamp: new Date().toISOString(),
});

export const getRejectValue = (error: unknown): ErrorResponse => {
  const axiosError = error as AxiosError<ErrorResponse>;
  const data = axiosError.response?.data;

  if (!data) return networkError();

  const retryAfterMs = parseRetryAfterMs(axiosError.response?.headers?.['retry-after']);

  return retryAfterMs === undefined ? data : { ...data, retryAfterMs };
};
