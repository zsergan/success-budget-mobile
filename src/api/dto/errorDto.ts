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
