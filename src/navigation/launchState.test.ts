import type { LaunchInputs } from './launchState';
import { getLaunchState } from './launchState';

const done = { hasData: true, hasError: false };
const pending = { hasData: false, hasError: false };
const failed = { hasData: false, hasError: true };

const signedIn: LaunchInputs = {
  resourcesReady: true,
  storedSession: 'read',
  isSignedIn: true,
  hasEntered: false,
  profile: { ...done, isUnauthorized: false },
  spaces: { ...done, isEmpty: false },
  hasSelectedSpace: true,
  wallets: done,
};

describe('getLaunchState', () => {
  it('waits for the local resources before anything else', () => {
    expect(getLaunchState({ ...signedIn, resourcesReady: false, storedSession: 'failed' })).toEqual({
      status: 'loading',
      stage: 'resources',
    });
  });

  it('tells a session still being read from one that could not be read, and neither from no session', () => {
    expect(getLaunchState({ ...signedIn, storedSession: 'reading' })).toEqual({
      status: 'loading',
      stage: 'storedSession',
    });
    expect(getLaunchState({ ...signedIn, storedSession: 'failed' })).toEqual({
      status: 'failed',
      stage: 'storedSession',
    });
    expect(getLaunchState({ ...signedIn, isSignedIn: false })).toEqual({ status: 'welcome' });
  });

  it('checks the session before the required data', () => {
    expect(
      getLaunchState({
        ...signedIn,
        profile: { ...pending, isUnauthorized: false },
        spaces: { ...failed, isEmpty: false },
      }),
    ).toEqual({
      status: 'loading',
      stage: 'session',
    });
    expect(getLaunchState({ ...signedIn, profile: { ...failed, isUnauthorized: false } })).toEqual({
      status: 'failed',
      stage: 'session',
    });
  });

  it('keeps loading on a refused session, which signs the user out instead of offering a retry', () => {
    expect(getLaunchState({ ...signedIn, profile: { ...failed, isUnauthorized: true } })).toEqual({
      status: 'loading',
      stage: 'session',
    });
  });

  it('never counts a failed required request as ready', () => {
    expect(getLaunchState({ ...signedIn, spaces: { ...failed, isEmpty: false } })).toEqual({
      status: 'failed',
      stage: 'requiredData',
    });
    expect(getLaunchState({ ...signedIn, wallets: failed })).toEqual({ status: 'failed', stage: 'requiredData' });
    expect(getLaunchState({ ...signedIn, wallets: pending })).toEqual({ status: 'loading', stage: 'requiredData' });
  });

  it('waits for a space to be selected from a non-empty list', () => {
    expect(getLaunchState({ ...signedIn, hasSelectedSpace: false, wallets: pending })).toEqual({
      status: 'loading',
      stage: 'requiredData',
    });
  });

  it('opens the app with no spaces, as there is no space data to wait for', () => {
    expect(
      getLaunchState({ ...signedIn, spaces: { ...done, isEmpty: true }, hasSelectedSpace: false, wallets: pending }),
    ).toEqual({ status: 'ready' });
  });

  it('stays ready once entered, whatever its queries do later', () => {
    expect(
      getLaunchState({ ...signedIn, hasEntered: true, spaces: { ...failed, isEmpty: false }, wallets: pending }),
    ).toEqual({ status: 'ready' });
    expect(getLaunchState({ ...signedIn, hasEntered: true, isSignedIn: false })).toEqual({ status: 'welcome' });
  });
});
