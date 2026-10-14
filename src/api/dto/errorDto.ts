// Error codes the app branches on; `message` is display text and may change.
export const ApiErrorCode = {
  CONFIRMATION_EMAIL_RATE_LIMITED: 'CONFIRMATION_EMAIL_RATE_LIMITED',
  CATEGORY_ARCHIVED: 'CATEGORY_ARCHIVED',
  CATEGORY_TYPE_MISMATCH: 'CATEGORY_TYPE_MISMATCH',
  WALLET_DELETED: 'WALLET_DELETED',
  FORBIDDEN_SPACE: 'FORBIDDEN_SPACE',
  FORBIDDEN_WALLET: 'FORBIDDEN_WALLET',
  FORBIDDEN_CATEGORY: 'FORBIDDEN_CATEGORY',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  TRANSACTION_NOT_IN_FEED: 'TRANSACTION_NOT_IN_FEED',
  TRANSACTION_VERSION_CONFLICT: 'TRANSACTION_VERSION_CONFLICT',
  TRANSACTION_OPERATION_EXISTS: 'TRANSACTION_OPERATION_EXISTS',
  TRANSACTION_OPERATION_NOT_FOUND: 'TRANSACTION_OPERATION_NOT_FOUND',
  IDEMPOTENCY_KEY_REUSED: 'IDEMPOTENCY_KEY_REUSED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
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
  // Why a request got no response at all (statusCode 0); only `getRejectValue` sets it.
  transport?: 'timeout' | 'canceled' | 'network';
}
