import type { ErrorResponse } from '@api/dto';

export const NETWORK_ERROR_MESSAGE = 'Could not reach the server. Check your connection and try again.';
export const RATE_LIMITED_MESSAGE = 'Too many requests. Please wait a moment and try again.';
const SERVER_ERROR_MESSAGE = 'Something went wrong on our end. Please try again later.';
const FALLBACK_ERROR_MESSAGE = 'Something went wrong. Please try again.';

// For a response whose body carries no message of the API's own: never a proxy page or its text.
export const getStatusMessage = (statusCode: number): string => {
  if (statusCode === 429) return RATE_LIMITED_MESSAGE;

  return statusCode >= 500 ? SERVER_ERROR_MESSAGE : FALLBACK_ERROR_MESSAGE;
};

export const isApiError = (error: unknown, statusCode: number, code?: string): boolean => {
  const response = error as Partial<ErrorResponse> | null | undefined;

  return response?.statusCode === statusCode && (code === undefined || response.code === code);
};

// 4xx messages are written for the user and passed through as-is; network
// failures and 5xx get a friendly message instead of a raw body or nothing.
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
