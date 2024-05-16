import { createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';

import type { LoginPayload } from '@api/dto';
import { login } from '@api/auth.api';
import { AUTH_TOKEN_KEY } from '@shared/constants';

export const loginMe = createAsyncThunk('auth/loginMe', async (payload: LoginPayload) => {
  const response = await login(payload);

  if (response.accessToken) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.accessToken);
  }

  return response;
});

export const logoutMe = createAsyncThunk('auth/logoutMe', async () => {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

  if (!token) {
    return null;
  }

  return token;
});
