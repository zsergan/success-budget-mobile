import type { RootState } from '@redux/Store';

export const selectLaunch = (state: RootState) => state.launch;

export const selectIsLaunching = (state: RootState) =>
  state.launch.phase === 'running' || state.launch.phase === 'failed';
