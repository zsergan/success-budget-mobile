import * as SecureStore from 'expo-secure-store';

import type { LoginPayload, RegisterPayload, VerifyEmailPayload } from '@api/dto';
import { login, register, verifyEmail } from '@api/auth.api';
import { AUTH_TOKEN_KEY } from '@shared/constants';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

export const registerMe = createAppAsyncThunk('auth/registerMe', async (payload: RegisterPayload, thunkAPI) => {
  try {
    return await register(payload);
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
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

export const checkAuth = createAppAsyncThunk('auth/checkAuth', async () => {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

    if (!token) {
      return null;
    }

    return token;
  } catch {
    // Treat a SecureStore failure as "no token" instead of hanging on LoadingScreen forever.
    return null;
  }
});
