export interface ErrorResponse {
  error?: string;
  message: string | { field: string; error: string }[];
  path: string;
  statusCode: number;
  timestamp: string;
  // Parsed from a 429 response's Retry-After header (seconds from now),
  // when present and valid. Only `getRejectValue` populates this.
  retryAfterMs?: number;
}
