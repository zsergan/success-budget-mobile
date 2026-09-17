import { configureStore } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';

import { login, register, verifyEmail } from '@api/auth.api';
import { AUTH_TOKEN_KEY } from '@shared/constants';
import categoryReducer from '../category/slice';
import currencyReducer from '../currency/slice';
import limitReducer from '../limit/slice';
import memberReducer from '../member/slice';
import profileReducer from '../profile/slice';
import spaceReducer from '../space/slice';
import transactionReducer from '../transaction/slice';
import walletReducer from '../wallet/slice';
import authReducer from './slice';
import { checkAuth, loginMe, logoutMe, registerMe, verifyEmailMe } from './thunks';

jest.mock('@api/auth.api');
jest.mock('expo-secure-store');

const mockedLogin = jest.mocked(login);
const mockedRegister = jest.mocked(register);
const mockedVerifyEmail = jest.mocked(verifyEmail);
const mockedSetItemAsync = jest.mocked(SecureStore.setItemAsync);
const mockedGetItemAsync = jest.mocked(SecureStore.getItemAsync);
const mockedDeleteItemAsync = jest.mocked(SecureStore.deleteItemAsync);

const testReducer = {
  auth: authReducer,
  category: categoryReducer,
  currency: currencyReducer,
  limit: limitReducer,
  member: memberReducer,
  profile: profileReducer,
  space: spaceReducer,
  transaction: transactionReducer,
  wallet: walletReducer,
};

const createTestStore = (preloadedState?: { auth: ReturnType<typeof authReducer> }) =>
  configureStore({ reducer: testReducer, preloadedState });

const errorResponse = {
  message: 'Invalid credentials',
  statusCode: 401,
  path: '/users/login',
  timestamp: '2026-01-01T00:00:00.000Z',
};

const axiosErrorFor = (data: unknown) => ({ response: { data } });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('loginMe', () => {
  it('stores the token and signs the user in on success', async () => {
    mockedLogin.mockResolvedValue('a-token');

    const store = createTestStore();
    const action = await store.dispatch(loginMe({ email: 'a@b.com', password: 'password1' }));

    expect(action.type).toBe('auth/loginMe/fulfilled');
    expect(mockedSetItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY, 'a-token');
    expect(store.getState().auth.isSignedIn).toBe(true);
    expect(store.getState().auth.userToken).toBe('a-token');
  });

  it('rejects with the server error body and does not sign the user in', async () => {
    mockedLogin.mockRejectedValue(axiosErrorFor(errorResponse));

    const store = createTestStore();
    const action = await store.dispatch(loginMe({ email: 'a@b.com', password: 'wrong' }));

    expect(action.type).toBe('auth/loginMe/rejected');
    expect(action.payload).toEqual(errorResponse);
    expect(mockedSetItemAsync).not.toHaveBeenCalled();
    expect(store.getState().auth.isSignedIn).toBe(false);
    expect(store.getState().auth.error).toEqual(errorResponse);
  });
});

describe('registerMe', () => {
  const registerPayload = { name: 'Alex', base_currency_id: 1, email: 'a@b.com', password: 'password1' };
  const profileResponse = { id: '1', email: 'a@b.com', name: 'Alex' };

  it('records the registered email on success without signing the user in yet', async () => {
    mockedRegister.mockResolvedValue(profileResponse);

    const store = createTestStore();
    const action = await store.dispatch(registerMe(registerPayload));

    expect(action.type).toBe('auth/registerMe/fulfilled');
    expect(store.getState().auth.userEmail).toBe('a@b.com');
    expect(store.getState().auth.isSignedIn).toBe(false);
  });

  it('rejects with the server error body, e.g. a duplicate email', async () => {
    const duplicateEmailError = {
      message: 'Email already registered',
      statusCode: 409,
      path: '/users/register',
      timestamp: '2026-01-01T00:00:00.000Z',
    };

    mockedRegister.mockRejectedValue(axiosErrorFor(duplicateEmailError));

    const store = createTestStore();
    const action = await store.dispatch(registerMe(registerPayload));

    expect(action.type).toBe('auth/registerMe/rejected');
    expect(action.payload).toEqual(duplicateEmailError);
    expect(store.getState().auth.error).toEqual(duplicateEmailError);
  });
});

describe('verifyEmailMe', () => {
  it('stores the token and signs the user in on a successful code', async () => {
    mockedVerifyEmail.mockResolvedValue('a-token');

    const store = createTestStore();
    const action = await store.dispatch(verifyEmailMe({ email: 'a@b.com', code: '123456' }));

    expect(action.type).toBe('auth/verifyEmailMe/fulfilled');
    expect(mockedSetItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY, 'a-token');
    expect(store.getState().auth.isSignedIn).toBe(true);
  });

  it('rejects with the server error body on an invalid code', async () => {
    const invalidCodeError = {
      message: 'Invalid or expired code',
      statusCode: 400,
      path: '/users/verify-email',
      timestamp: '2026-01-01T00:00:00.000Z',
    };

    mockedVerifyEmail.mockRejectedValue(axiosErrorFor(invalidCodeError));

    const store = createTestStore();
    const action = await store.dispatch(verifyEmailMe({ email: 'a@b.com', code: '000000' }));

    expect(action.type).toBe('auth/verifyEmailMe/rejected');
    expect(action.payload).toEqual(invalidCodeError);
    expect(store.getState().auth.isSignedIn).toBe(false);
    expect(store.getState().auth.error).toEqual(invalidCodeError);
  });
});

describe('checkAuth', () => {
  it('signs the user in when a token is already stored', async () => {
    mockedGetItemAsync.mockResolvedValue('a-token');

    const store = createTestStore();
    const action = await store.dispatch(checkAuth());

    expect(action.type).toBe('auth/checkAuth/fulfilled');
    expect(store.getState().auth.isSignedIn).toBe(true);
  });

  it('does not get stuck loading if SecureStore throws -- resolves as if there were no token', async () => {
    mockedGetItemAsync.mockRejectedValue(new Error('Keystore is corrupted'));

    const store = createTestStore();
    const action = await store.dispatch(checkAuth());

    expect(action.type).toBe('auth/checkAuth/fulfilled');
    expect(action.payload).toBeNull();
    expect(store.getState().auth.isSignedIn).toBe(false);
    expect(store.getState().auth.isLoading).toBe(false);
  });
});

describe('logoutMe', () => {
  it('clears the session even if SecureStore fails to delete the token', async () => {
    mockedDeleteItemAsync.mockRejectedValue(new Error('Keystore is corrupted'));

    const store = createTestStore({
      auth: { isLoading: false, isSignedIn: true, userToken: 'a-token', userEmail: null },
    });

    const action = await store.dispatch(logoutMe());

    expect(action.type).toBe('auth/logoutMe/fulfilled');
    expect(store.getState().auth.isSignedIn).toBe(false);
    expect(store.getState().auth.userToken).toBeNull();
  });
});
