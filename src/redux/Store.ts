import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { baseApi } from './api/baseApi';
import authReducer from './state/auth/slice';
import { logoutMe } from './state/auth/thunks';
import memberReducer from './state/member/slice';
import spaceReducer from './state/space/slice';

const rootReducer = combineReducers({
  auth: authReducer,
  member: memberReducer,
  space: spaceReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const createAppStore = (preloadedState?: Partial<RootState>) => {
  const sessionListener = createListenerMiddleware<RootState>();

  // Runs right after the slices reset, before React unmounts the signed-in
  // screens; resetApiState also aborts every running query and mutation.
  sessionListener.startListening({
    actionCreator: logoutMe.fulfilled,
    effect: (_, { dispatch }) => {
      dispatch(baseApi.util.resetApiState());
    },
  });

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(sessionListener.middleware).concat(baseApi.middleware),
  });
};

const store = createAppStore();

export default store;
export type AppDispatch = typeof store.dispatch;
// For a plain (non-async-thunk) action creator that needs dispatch/getState,
// e.g. one that decides synchronously whether to dispatch a follow-up
// action -- createAppAsyncThunk is for API calls, not this.
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action>;
