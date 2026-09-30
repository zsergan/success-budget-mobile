import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { renderHook } from '@testing-library/react-native';

import useRefreshOnReturn from './useRefreshOnReturn';

let focusListener: (() => void) | undefined;
let isFocused = true;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

const mockNavigation = {
  addListener: (_event: 'focus', listener: () => void) => {
    focusListener = listener;
    return () => {
      focusListener = undefined;
    };
  },
  isFocused: () => isFocused,
};

let appStateListener: ((state: AppStateStatus) => void) | undefined;

beforeEach(() => {
  isFocused = true;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    appStateListener = listener as (state: AppStateStatus) => void;
    return { remove: () => (appStateListener = undefined) } as ReturnType<typeof AppState.addEventListener>;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useRefreshOnReturn', () => {
  it('fires when the screen regains focus', () => {
    const onReturn = jest.fn();
    renderHook(() => useRefreshOnReturn(onReturn));

    focusListener?.();

    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it('fires when the app comes back from the background on this screen', () => {
    const onReturn = jest.fn();
    renderHook(() => useRefreshOnReturn(onReturn));

    appStateListener?.('inactive');
    appStateListener?.('active');
    expect(onReturn).not.toHaveBeenCalled();

    appStateListener?.('background');
    appStateListener?.('active');
    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it('leaves the refresh to the next focus when the app returns on another screen', () => {
    const onReturn = jest.fn();
    renderHook(() => useRefreshOnReturn(onReturn));
    isFocused = false;

    appStateListener?.('background');
    appStateListener?.('active');

    expect(onReturn).not.toHaveBeenCalled();
  });

  it('stops listening once unmounted', () => {
    const { unmount } = renderHook(() => useRefreshOnReturn(jest.fn()));

    unmount();

    expect(focusListener).toBeUndefined();
    expect(appStateListener).toBeUndefined();
  });
});
