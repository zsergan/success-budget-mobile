import NetInfo from '@react-native-community/netinfo';
import * as Font from 'expo-font';

import type { ErrorResponse } from '@api/dto';
import type { AppThunk } from '@redux/Store';
import { APP_FONTS } from '@shared/fonts';
import { readStoredSession } from '../auth/thunks';
import { profileApi } from '../profile/api';
import { spaceApi } from '../space/api';
import { selectCurrentSpaceId } from '../space/selectors';
import { walletApi } from '../wallet/api';
import { attemptFailed, attemptSettled, attemptStarted, stageReached } from './actions';
import type { LaunchFailure, LaunchStage } from './initialState';

// Covers every stage of one attempt; each request also keeps its own 20 s timeout (instance.ts).
export const LAUNCH_ATTEMPT_DEADLINE_MS = 30_000;

// Fallback only: prefer the 429's `retryAfterMs`.
export const LAUNCH_RATE_LIMIT_COOLDOWN_MS = 10_000;

interface Cancellable {
  abort: () => void;
}

type QueryOutcome = { data?: unknown; error?: unknown };

const hasConfirmedNoInternet = async () => {
  const network = await NetInfo.fetch();

  // A Wi-Fi link alone is not the internet: only a failed reachability check confirms it is gone.
  return network.isConnected === false || network.isInternetReachable === false;
};

// null: nothing to report. The session or attempt the request belonged to is over, or a 401 is
// already ending the session through the client (instance.ts), which takes the app to Welcome.
const classifyFailure = async (error: unknown): Promise<{ failure: LaunchFailure; retryAt?: number } | null> => {
  const response = error as (Partial<ErrorResponse> & { name?: string }) | undefined;

  if (response?.isStale || response?.transport === 'canceled' || response?.name === 'AbortError') return null;
  if (response?.statusCode === 401) return null;
  if (response?.statusCode === 429) {
    return { failure: 'rateLimited', retryAt: Date.now() + (response.retryAfterMs ?? LAUNCH_RATE_LIMIT_COOLDOWN_MS) };
  }
  if (response?.statusCode) return { failure: 'server' };
  if (response?.transport === 'timeout') return { failure: 'unreachable' };

  return { failure: (await hasConfirmedNoInternet()) ? 'offline' : 'unreachable' };
};

// One attempt from the local resources to Welcome or the app. Data goes through the API layer's own cache;
// what an earlier stage already loaded is reused when an attempt is repeated.
export const runLaunch = (): AppThunk<Promise<void>> => async (dispatch, getState) => {
  const attempt = getState().launch.attempt + 1;
  const running = new Set<Cancellable>();
  const isLive = () => getState().launch.attempt === attempt && getState().launch.phase === 'running';

  dispatch(attemptStarted({ attempt, startedAt: Date.now() }));

  const deadline = setTimeout(() => {
    if (!isLive()) return;

    // Fonts that never finish loading are the app's own files, not the server.
    const failure = getState().launch.stage === 'resources' ? 'resources' : 'unreachable';

    dispatch(attemptFailed({ attempt, failure }));
    running.forEach((request) => request.abort());
  }, LAUNCH_ATTEMPT_DEADLINE_MS);

  const enter = (stage: LaunchStage) => dispatch(stageReached({ attempt, stage }));

  const fetch = async <T extends QueryOutcome>(request: Cancellable & PromiseLike<T>) => {
    running.add(request);

    try {
      return await request;
    } finally {
      running.delete(request);
    }
  };

  // Late answers of an attempt that already failed, was repeated or belonged to a session since ended change nothing.
  const fail = async (error: unknown) => {
    const outcome = await classifyFailure(error);

    if (outcome && isLive()) dispatch(attemptFailed({ attempt, ...outcome }));
  };

  try {
    enter('resources');

    try {
      await Font.loadAsync(APP_FONTS);
    } catch {
      if (isLive()) dispatch(attemptFailed({ attempt, failure: 'resources' }));
      return;
    }

    if (!isLive()) return;

    if (getState().auth.storedSession !== 'read') {
      enter('storedSession');

      const read = await dispatch(readStoredSession());

      if (!isLive()) return;
      if (readStoredSession.rejected.match(read)) {
        dispatch(attemptFailed({ attempt, failure: 'storage' }));
        return;
      }
    }

    if (!getState().auth.isSignedIn) {
      dispatch(attemptSettled({ attempt, phase: 'welcome' }));
      return;
    }

    enter('session');

    const profile = await fetch(dispatch(profileApi.endpoints.getProfile.initiate(undefined, { subscribe: false })));

    if (!isLive()) return;
    if (profile.error) return await fail(profile.error);

    enter('requiredData');

    const spaces = await fetch(dispatch(spaceApi.endpoints.getSpaces.initiate(undefined, { subscribe: false })));

    if (!isLive()) return;
    if (spaces.error) return await fail(spaces.error);

    // The spaces list selects a space as it arrives (space/listeners.ts); with none there is no space data to wait for.
    const spaceId = selectCurrentSpaceId(getState());

    if (spaceId !== null) {
      const wallets = await fetch(dispatch(walletApi.endpoints.getWallets.initiate({ spaceId }, { subscribe: false })));

      if (!isLive()) return;
      if (wallets.error) return await fail(wallets.error);
    }

    dispatch(attemptSettled({ attempt, phase: 'ready' }));
  } finally {
    // An attempt left running (a 401 waiting for the client to end the session) still fails at the deadline.
    if (!isLive()) clearTimeout(deadline);
  }
};

// Starts one new attempt from a failure; presses while one runs, or before a 429's pause is over, do nothing.
export const retryLaunch = (): AppThunk => (dispatch, getState) => {
  const { phase, retryAt } = getState().launch;

  if (phase !== 'failed' || (retryAt !== null && Date.now() < retryAt)) return;

  dispatch(runLaunch());
};
