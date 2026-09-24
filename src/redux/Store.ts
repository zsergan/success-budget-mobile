import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { combineReducers, configureStore } from '@reduxjs/toolkit';

import authReducer from './state/auth/slice';
import categoryReducer from './state/category/slice';
import currencyReducer from './state/currency/slice';
import limitReducer from './state/limit/slice';
import memberReducer from './state/member/slice';
import profileReducer from './state/profile/slice';
import spaceReducer from './state/space/slice';
import transactionReducer from './state/transaction/slice';
import walletReducer from './state/wallet/slice';

const rootReducer = combineReducers({
  auth: authReducer,
  category: categoryReducer,
  currency: currencyReducer,
  limit: limitReducer,
  member: memberReducer,
  profile: profileReducer,
  space: spaceReducer,
  transaction: transactionReducer,
  wallet: walletReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const createAppStore = (preloadedState?: Partial<RootState>) =>
  configureStore({ reducer: rootReducer, preloadedState });

const store = createAppStore();

export default store;
export type AppDispatch = typeof store.dispatch;
// For a plain (non-async-thunk) action creator that needs dispatch/getState,
// e.g. one that decides synchronously whether to dispatch a follow-up
// action -- createAppAsyncThunk is for API calls, not this.
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action>;
