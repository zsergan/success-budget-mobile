import { useCallback } from 'react';
import { useNavigationContainerRef } from '@react-navigation/native';

import { useToastControl } from '@components/Toast/ToastProvider';
import { ScreenNames } from '@shared/enums';
import type { RootStackParamList } from '@shared/types';

import focusedRoutePath from './focusedRoutePath';

// Tells the toast which screen is in focus, which ends the toasts of the one before it, and whether the tab bar shows.
const useToastRouteReporting = () => {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const { reportRoute } = useToastControl();

  const reportFocusedRoute = useCallback(() => {
    const state = navigationRef.getRootState();
    reportRoute(focusedRoutePath(state), state?.routes[state.index]?.name === ScreenNames.HOME_SCREEN);
  }, [navigationRef, reportRoute]);

  return { navigationRef, reportFocusedRoute };
};

export default useToastRouteReporting;
