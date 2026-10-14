import * as SecureStore from 'expo-secure-store';

import type { LoginPayload, RegisterPayload, VerifyEmailPayload } from '@api/dto';
import { isConfirmationAlreadyRequested, login, register, verifyEmail } from '@api/auth.api';
import { AUTH_TOKEN_KEY } from '@shared/constants';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

export const registerMe = createAppAsyncThunk('auth/registerMe', async (payload: RegisterPayload, thunkAPI) => {
  try {
    const { email } = await register(payload);

    return { email };
  } catch (error: unknown) {
    const rejectValue = getRejectValue(error);

    // The account exists and its code is on the way, so this sign-up continues to verification.
    if (isConfirmationAlreadyRequested(rejectValue)) {
      return { email: payload.email };
    }

    return thunkAPI.rejectWithValue(rejectValue);
  }
});

export const verifyEmailMe = createAppAsyncThunk(
  'auth/verifyEmailMe',
  async (payload: VerifyEmailPayload, thunkAPI) => {
    try {
      const accessToken = await verifyEmail(payload);

      if (accessToken) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, accessToken);
      }

      return accessToken;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);

export const loginMe = createAppAsyncThunk('auth/loginMe', async (payload: LoginPayload, thunkAPI) => {
  try {
    const accessToken = await login(payload);

    if (accessToken) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, accessToken);
    }

    return accessToken;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const logoutMe = createAppAsyncThunk('auth/logoutMe', async () => {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch {
    // Logout must still clear the session even if the storage delete fails.
  }
});

// Rejects when the storage itself fails: a saved session may still be there, so it is read again, not dropped.
export const readStoredSession = createAppAsyncThunk('auth/readStoredSession', () =>
  SecureStore.getItemAsync(AUTH_TOKEN_KEY),
);
