export type LaunchStage = 'resources' | 'storedSession' | 'session' | 'requiredData';

export type LaunchFailure = 'resources' | 'storage' | 'offline' | 'unreachable' | 'server' | 'rateLimited';

interface LaunchState {
  // Identifies one run from the fonts to Welcome or the app; whatever an older one reports is ignored.
  attempt: number;
  phase: 'running' | 'failed' | 'welcome' | 'ready';
  stage: LaunchStage;
  // When the current attempt started (ms since epoch), for the screen's long-wait state.
  startedAt: number;
  failure: LaunchFailure | null;
  // A 429 asks for a pause: Try again does nothing before then.
  retryAt: number | null;
}

const initialState: LaunchState = {
  attempt: 0,
  phase: 'running',
  stage: 'resources',
  startedAt: 0,
  failure: null,
  retryAt: null,
};

export type { LaunchState };

export default initialState;
