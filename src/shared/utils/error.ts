import type { ErrorResponse } from '@api/dto';

export const NETWORK_ERROR_MESSAGE = 'Could not reach the server. Check your connection and try again.';
const SERVER_ERROR_MESSAGE = 'Something went wrong on our end. Please try again later.';
const FALLBACK_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export const isApiError = (error: unknown, statusCode: number, message?: string): boolean => {
  const response = error as Partial<ErrorResponse> | null | undefined;

  return response?.statusCode === statusCode && (message === undefined || response.message === message);
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
