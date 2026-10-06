import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { bindHttpSession } from '@api/session';

import { baseApi } from './api/baseApi';
import authReducer from './state/auth/slice';
import { logoutMe } from './state/auth/thunks';
import { startSpaceSelectionListener } from './state/space/listeners';
import memberReducer from './state/member/slice';
import spaceReducer from './state/space/slice';
import transactionFlowReducer from './state/transactionFlow/slice';

const rootReducer = combineReducers({
  auth: authReducer,
  member: memberReducer,
  space: spaceReducer,
  transactionFlow: transactionFlowReducer,
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

  startSpaceSelectionListener(sessionListener);

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(sessionListener.middleware).concat(baseApi.middleware),
  });
};

const store = createAppStore();

bindHttpSession({
  getKey: () => store.getState().auth.sessionKey,
  end: () => store.dispatch(logoutMe()),
});

export default store;
export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action>;
