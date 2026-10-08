import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { Method } from 'axios';

import type { ErrorResponse } from '@api/dto';
import { createHttpClient } from '@api/instance';
import { getRejectValue } from '@redux/createAppAsyncThunk';
import type { RootState } from '@redux/Store';

export interface HttpRequest {
  url: string;
  method?: Method;
  body?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

const http = createHttpClient();

const sessionEndedError = (url: string): ErrorResponse => ({
  message: 'The session this request belonged to has ended.',
  path: url,
  statusCode: 0,
  timestamp: new Date().toISOString(),
  isStale: true,
});

// A response that outlives the session it was sent in never reaches the cache
// or an onQueryStarted side effect as a success, even if logout could not abort it.
export const httpBaseQuery: BaseQueryFn<HttpRequest, unknown, ErrorResponse> = async (
  { url, method = 'GET', body, params, headers },
  { signal, getState },
) => {
  const sessionKey = (getState() as RootState).auth.sessionKey;
  const isSessionCurrent = () => (getState() as RootState).auth.sessionKey === sessionKey;

  try {
    const response = await http.request({ url, method, data: body, params, headers, signal, sessionKey });

    // RTK Query treats `data: undefined` as a malformed result; empty bodies (void handlers) become null.
    return isSessionCurrent() ? { data: response.data ?? null } : { error: sessionEndedError(url) };
  } catch (error: unknown) {
    return { error: isSessionCurrent() ? getRejectValue(error) : sessionEndedError(url) };
  }
};
