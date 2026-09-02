import type { ErrorResponse } from '@api/dto';

const NETWORK_ERROR_MESSAGE = 'Could not reach the server. Check your connection and try again.';
const SERVER_ERROR_MESSAGE = 'Something went wrong on our end. Please try again later.';
const FALLBACK_ERROR_MESSAGE = 'Something went wrong. Please try again.';

// A thunk rejects with the ErrorResponse body (see createAppAsyncThunk),
// or with undefined when the request never got a response at all (offline,
// timeout, DNS failure). Map both of those to a friendly message instead of
// showing a raw 5xx body or nothing; a 4xx validation message is meant for
// the user, so it is passed through as-is.
export const getErrorMessage = (error: unknown): string => {
  const response = error as Partial<ErrorResponse> | undefined;

  if (!response) {
    return NETWORK_ERROR_MESSAGE;
  }

  if (response.statusCode !== undefined && response.statusCode >= 500) {
    return SERVER_ERROR_MESSAGE;
  }

  if (Array.isArray(response.message)) {
    return response.message[0]?.error || FALLBACK_ERROR_MESSAGE;
  }

  return response.message || FALLBACK_ERROR_MESSAGE;
};
