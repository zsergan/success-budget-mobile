const FALLBACK_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export const getErrorMessage = (error: unknown): string => {
  const message = (error as { message?: string | { field: string; error: string }[] } | undefined)?.message;

  if (Array.isArray(message)) {
    return message[0]?.error || FALLBACK_ERROR_MESSAGE;
  }

  return message || FALLBACK_ERROR_MESSAGE;
};
