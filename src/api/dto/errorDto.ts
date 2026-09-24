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
  // Parsed from a 429 response's Retry-After header (seconds from now),
  // when present and valid. Only `getRejectValue` populates this.
  retryAfterMs?: number;
  // Set by httpBaseQuery (not getRejectValue) when the session that sent the
  // request ended before it settled; consumers treat it as a no-op.
  isStale?: boolean;
}
