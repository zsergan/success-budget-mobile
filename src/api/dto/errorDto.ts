// Server messages (backend ErrorMessages) the app branches on, not just displays.
export const ApiErrorMessage = {
  CONFIRMATION_EMAIL_RATE_LIMITED: 'A confirmation email was already requested, please try again shortly',
  CATEGORY_ARCHIVED: 'An archived category cannot be added to a limit',
} as const;

export interface ErrorResponse {
  error?: string;
  message: string | { field: string; error: string }[];
  path: string;
  statusCode: number;
  timestamp: string;
  // From a 429's Retry-After header when it parses; only `getRejectValue` sets it.
  retryAfterMs?: number;
  // Set by httpBaseQuery (not getRejectValue) when the session that sent the
  // request ended before it settled; consumers treat it as a no-op.
  isStale?: boolean;
}
