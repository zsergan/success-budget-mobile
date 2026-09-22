export interface ErrorResponse {
  error?: string;
  message: string | { field: string; error: string }[];
  path: string;
  statusCode: number;
  timestamp: string;
  // Parsed from a 429 response's Retry-After header (seconds from now),
  // when present and valid. Only `getRejectValue` populates this.
  retryAfterMs?: number;
  // Set by a thunk itself (not getRejectValue) when it detects, after the
  // request settled, that the session/context it ran in is no longer
  // current -- e.g. a logout while it was in flight. A consumer that would
  // otherwise act on this rejection (set a cooldown, show an alert) should
  // treat it as a no-op instead.
  isStale?: boolean;
}
