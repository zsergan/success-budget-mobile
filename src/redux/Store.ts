import type { Action, ListenerMiddlewareInstance, ThunkAction, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { bindHttpSession } from '@api/session';

import { baseApi } from './api/baseApi';
import authReducer from './state/auth/slice';
import { logoutMe } from './state/auth/thunks';
import launchReducer from './state/launch/slice';
import { selectIsLaunching } from './state/launch/selectors';
import { startActiveSpacePersistence, startSpaceSelectionListener } from './state/space/listeners';
import invitationReducer from './state/invitation/slice';
import { startInvitationPersistence } from './state/invitation/listeners';
import memberReducer from './state/member/slice';
import passwordResetReducer from './state/passwordReset/slice';
import pendingWriteReducer from './state/pendingWrite/slice';
import spaceReducer from './state/space/slice';
import spaceCreationReducer from './state/spaceCreation/slice';
import transactionFlowReducer from './state/transactionFlow/slice';

const rootReducer = combineReducers({
  auth: authReducer,
  invitation: invitationReducer,
  launch: launchReducer,
  member: memberReducer,
  passwordReset: passwordResetReducer,
  pendingWrite: pendingWriteReducer,
  space: spaceReducer,
  spaceCreation: spaceCreationReducer,
  transactionFlow: transactionFlowReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// A send of a stored write, or a check of a create by its operation id (`writeLockKey`).
export interface RunningWrite {
  kind: 'send' | 'check';
  promise: Promise<unknown>;
}

export interface ThunkExtra {
  // One attempt per write at a time: a send or a check asked for while one runs joins it, and a send asked for during
  // a check waits for its answer.
  runningWrites: Map<string, RunningWrite>;
  // A user's stored writes being read back; until then nothing is known about what they left unsettled.
  restoringWrites: Map<number, Promise<unknown>>;
}

export type AppListener = ListenerMiddlewareInstance<RootState, ThunkDispatch<RootState, ThunkExtra, UnknownAction>>;

export const createAppStore = (preloadedState?: Partial<RootState>) => {
  const sessionListener: AppListener = createListenerMiddleware();

  // Runs right after the slices reset, before React unmounts the signed-in
  // screens; resetApiState also aborts every running query and mutation.
  sessionListener.startListening({
    actionCreator: logoutMe.fulfilled,
    effect: (_, { dispatch }) => {
      dispatch(baseApi.util.resetApiState());
    },
  });

  startSpaceSelectionListener(sessionListener);
  startActiveSpacePersistence(sessionListener);
  startInvitationPersistence(sessionListener);

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: { extraArgument: { runningWrites: new Map(), restoringWrites: new Map() } satisfies ThunkExtra },
      })
        .prepend(sessionListener.middleware)
        .concat(baseApi.middleware),
  });
};

const store = createAppStore();

bindHttpSession({
  getKey: () => store.getState().auth.sessionKey,
  end: () => store.dispatch(logoutMe({ reason: 'sessionExpired' })),
  isLaunching: () => selectIsLaunching(store.getState()),
});

export default store;
export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, ThunkExtra, Action>;
