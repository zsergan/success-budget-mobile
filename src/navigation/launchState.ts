export type LaunchStage = 'resources' | 'storedSession' | 'session' | 'requiredData';

export type LaunchState =
  | { status: 'loading'; stage: LaunchStage }
  | { status: 'failed'; stage: LaunchStage }
  | { status: 'welcome' }
  | { status: 'ready' };

export type LaunchProgress = Extract<LaunchState, { stage: LaunchStage }>;

export interface RequiredQuery {
  hasData: boolean;
  hasError: boolean;
}

export interface LaunchInputs {
  resourcesReady: boolean;
  storedSession: 'reading' | 'failed' | 'read';
  isSignedIn: boolean;
  // This session has already reached the app; a later refetch or space switch must not take it back.
  hasEntered: boolean;
  profile: RequiredQuery & { isUnauthorized: boolean };
  spaces: RequiredQuery & { isEmpty: boolean };
  hasSelectedSpace: boolean;
  wallets: RequiredQuery;
}

const loading = (stage: LaunchStage): LaunchState => ({ status: 'loading', stage });

const WELCOME: LaunchState = { status: 'welcome' };
const READY: LaunchState = { status: 'ready' };

const awaiting = (stage: LaunchStage, query: RequiredQuery): LaunchState | null => {
  if (query.hasData) return null;

  return query.hasError ? { status: 'failed', stage } : loading(stage);
};

export const getLaunchState = (inputs: LaunchInputs): LaunchState => {
  const { profile, spaces } = inputs;

  if (!inputs.resourcesReady) return loading('resources');
  if (inputs.storedSession === 'reading') return loading('storedSession');
  if (inputs.storedSession === 'failed') return { status: 'failed', stage: 'storedSession' };
  if (!inputs.isSignedIn) return WELCOME;
  if (inputs.hasEntered) return READY;

  // A refused token ends the session (see instance.ts); until that lands it is not a failure to retry.
  if (profile.isUnauthorized) return loading('session');

  const pending = awaiting('session', profile) ?? awaiting('requiredData', spaces);

  if (pending) return pending;
  // No spaces is a valid account state: there is no space data to wait for.
  if (spaces.isEmpty) return READY;
  // The spaces list selects a space as it arrives (space/listeners.ts).
  if (!inputs.hasSelectedSpace) return loading('requiredData');

  return awaiting('requiredData', inputs.wallets) ?? READY;
};
