import type { AxiosError } from 'axios';
import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

import type { ErrorResponse } from '@api/dto';
import type { RootState } from '@redux/Store';
import { getStatusMessage, NETWORK_ERROR_MESSAGE } from '@shared/utils/error';

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

const isString = (value: unknown): value is string => typeof value === 'string';

const isFieldErrors = (value: unknown): value is { field: string; error: string }[] =>
  Array.isArray(value) &&
  value.every((item) => typeof item === 'object' && item !== null && isString(item.field) && isString(item.error));

// The API's own error body; anything else (an empty body, a proxy's HTML, some other JSON) keeps only its status.
const readApiBody = (data: unknown): Partial<ErrorResponse> => {
  if (typeof data !== 'object' || data === null) return {};

  const body = data as Record<string, unknown>;

  if (typeof body.statusCode !== 'number' || !(isString(body.message) || isFieldErrors(body.message))) return {};

  return {
    message: body.message,
    ...(isString(body.code) && { code: body.code }),
    ...(isString(body.error) && { error: body.error }),
    ...(isString(body.requestId) && { requestId: body.requestId }),
    ...(isString(body.path) && { path: body.path }),
    ...(isString(body.timestamp) && { timestamp: body.timestamp }),
  };
};

export const getRejectValue = (error: unknown): ErrorResponse => {
  const axiosError = error as AxiosError;
  const response = axiosError.response;

  if (!response) return networkError(transportOf(axiosError));

  const statusCode = response.status;
  const retryAfterMs = parseRetryAfterMs(response.headers?.['retry-after']);

  return {
    message: getStatusMessage(statusCode),
    path: axiosError.config?.url ?? '',
    timestamp: new Date().toISOString(),
    ...readApiBody(response.data),
    statusCode,
    ...(retryAfterMs !== undefined && { retryAfterMs }),
  };
};
