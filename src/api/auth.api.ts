import { isApiError } from '@shared/utils/error';
import type { LoginPayload, ProfileResponse, RegisterPayload, VerifyEmailPayload } from './dto';
import { ApiErrorCode } from './dto';
import { ApiClient } from './instance';

const api = ApiClient();

// Sign In explains a 429 in its own message, so the generic alert stays quiet.
export const login = async (payload: LoginPayload) => {
  const response = await api.post<string>('/users/login', payload, { isHandledRateLimit: () => true });

  return response.data;
};

// A second sign-up for the same email while the first is still sending its code.
export const isConfirmationAlreadyRequested = (error: unknown) =>
  isApiError(error, 429, ApiErrorCode.CONFIRMATION_EMAIL_RATE_LIMITED);

export const register = async (payload: RegisterPayload) => {
  const response = await api.post<ProfileResponse>('/users/register', payload, {
    isHandledRateLimit: isConfirmationAlreadyRequested,
  });

  return response.data;
};

export const verifyEmail = async (payload: VerifyEmailPayload) => {
  const response = await api.post<string>('/users/verify-email', payload);

  return response.data;
};
