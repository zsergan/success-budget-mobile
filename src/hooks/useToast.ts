import { useContext, useMemo } from 'react';
import { NavigationRouteContext } from '@react-navigation/native';

import type { ToastMessage } from '@components/Toast/message';
import { useToastControl } from '@components/Toast/ToastProvider';

// Toasts for this screen. Start a ticket with `begin()` when the work starts, so its result is shown only if the user
// is still where they asked for it; `show` is for a message about something already done.
const useToast = () => {
  const { begin } = useToastControl();
  const routeKey = useContext(NavigationRouteContext)?.key;

  return useMemo(
    () => ({
      begin: () => begin(routeKey),
      show: (message: ToastMessage) => begin(routeKey).show(message),
    }),
    [begin, routeKey],
  );
};

export default useToast;
