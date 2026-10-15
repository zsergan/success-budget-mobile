import type {
  PasswordResetAuthorizationResponse,
  PasswordResetCompletePayload,
  PasswordResetRequestedResponse,
  PasswordResetRequestPayload,
  PasswordResetVerifyPayload,
} from '@api/dto';
import { baseApi } from '@redux/api/baseApi';

// Every 429 here is explained on the recovery screen itself, with its Retry-After.
const isHandledRateLimit = () => true;

// Trigger these with `track: false` (see useRecoveryRequest): codes, tokens and passwords never stay in the cache.
export const passwordResetApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    requestPasswordReset: build.mutation<PasswordResetRequestedResponse, PasswordResetRequestPayload>({
      query: (body) => ({ url: '/users/password-reset/request', method: 'POST', body, isHandledRateLimit }),
    }),
    verifyPasswordReset: build.mutation<PasswordResetAuthorizationResponse, PasswordResetVerifyPayload>({
      query: (body) => ({ url: '/users/password-reset/verify', method: 'POST', body, isHandledRateLimit }),
    }),
    completePasswordReset: build.mutation<void, PasswordResetCompletePayload>({
      query: (body) => ({ url: '/users/password-reset/complete', method: 'POST', body, isHandledRateLimit }),
    }),
  }),
});
