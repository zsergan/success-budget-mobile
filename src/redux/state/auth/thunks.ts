import { createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import type { AxiosError } from 'axios';

import type { ErrorResponse, LoginPayload, RegisterPayload, VerifyEmailPayload } from '@api/dto';
import { login, register, verifyEmail } from '@api/auth.api';
import { AUTH_TOKEN_KEY } from '@shared/constants';

export const registerMe = createAsyncThunk('auth/registerMe', async (payload: RegisterPayload, thunkAPI) => {
  try {
    return await register(payload);
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue((error as AxiosError<ErrorResponse>).response?.data);
  }
});

export const verifyEmailMe = createAsyncThunk('auth/verifyEmailMe', async (payload: VerifyEmailPayload, thunkAPI) => {
  try {
    const accessToken = await verifyEmail(payload);

    if (accessToken) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, accessToken);
    }

    return accessToken;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue((error as AxiosError<ErrorResponse>).response?.data);
  }
});

export const loginMe = createAsyncThunk('auth/loginMe', async (payload: LoginPayload, thunkAPI) => {
  try {
    const accessToken = await login(payload);

    if (accessToken) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, accessToken);
    }

    return accessToken;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue((error as AxiosError<ErrorResponse>).response?.data);
  }
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
