import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectIsInvitationOpenRequested } from '@redux/state/invitation/selectors';
import { invitationOpenHandled } from '@redux/state/invitation/slice';
import { receiveInvitationLink, restoreInvitation } from '@redux/state/invitation/thunks';
import { ScreenNames } from '@shared/enums';
import type { RootStackParamList } from '@shared/types';

// Takes invitation links from a cold start and while running, and opens the invitation flow only once the app is
// ready: the stored session read, the user signed in and the required data loaded.
const useInvitationLinks = (navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>, isReady: boolean) => {
  const dispatch = useAppDispatch();
  const isOpenRequested = useAppSelector(selectIsInvitationOpenRequested);
  const [isNavigationReady, setNavigationReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void dispatch(restoreInvitation());
    void Linking.getInitialURL().then((url) => {
      if (isMounted && url) dispatch(receiveInvitationLink(url));
    });
    const subscription = Linking.addEventListener('url', ({ url }) => dispatch(receiveInvitationLink(url)));

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isReady || !isOpenRequested || !isNavigationReady) return;

    // The same link delivered again finds the flow already open and opens no second one.
    const state = navigationRef.getRootState();
    if (state?.routes[state.index]?.name !== ScreenNames.ACCEPT_INVITE_SCREEN) {
      navigationRef.navigate(ScreenNames.ACCEPT_INVITE_SCREEN);
    }
    dispatch(invitationOpenHandled());
  }, [dispatch, navigationRef, isReady, isOpenRequested, isNavigationReady]);

  return { onNavigationReady: useCallback(() => setNavigationReady(true), []) };
};

export default useInvitationLinks;
