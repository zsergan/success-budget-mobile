// Error codes the app branches on; `message` is display text and may change.
export const ApiErrorCode = {
  CONFIRMATION_EMAIL_RATE_LIMITED: 'CONFIRMATION_EMAIL_RATE_LIMITED',
  CATEGORY_ARCHIVED: 'CATEGORY_ARCHIVED',
} as const;

export interface ErrorResponse {
  error?: string;
  code?: string;
  requestId?: string;
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
