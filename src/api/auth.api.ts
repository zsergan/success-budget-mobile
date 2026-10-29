import { isApiError } from '@shared/utils/error';
import type { LoginPayload, ProfileResponse, RegisterPayload, VerifyEmailPayload } from './dto';
import { ApiErrorCode } from './dto';
import { ApiClient } from './instance';

const api = ApiClient();

// Sign In, Sign Up and Verify Email explain a 429 on screen, so the generic toast stays quiet.
const isHandledRateLimit = () => true;

export const login = async (payload: LoginPayload) => {
  const response = await api.post<string>('/users/login', payload, { isHandledRateLimit });

  return response.data;
};

// A second sign-up for the same email while the first is still sending its code.
export const isConfirmationAlreadyRequested = (error: unknown) =>
  isApiError(error, 429, ApiErrorCode.CONFIRMATION_EMAIL_RATE_LIMITED);

export const register = async (payload: RegisterPayload) => {
  const response = await api.post<ProfileResponse>('/users/register', payload, { isHandledRateLimit });

  return response.data;
};

export const verifyEmail = async (payload: VerifyEmailPayload) => {
  const response = await api.post<string>('/users/verify-email', payload, { isHandledRateLimit });

  return response.data;
};
