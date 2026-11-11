import { useCallback, useEffect, useState } from 'react';

import { useSpaceArg } from '@redux/hooks';
import { useGetMembersQuery } from '@redux/state/member/api';

export const DELIVERY_POLL_INTERVAL_MS = 5_000;
// How long one look at the screen, an invite or a resend keeps asking; a stuck queue is not polled forever.
export const DELIVERY_POLL_WINDOW_MS = 120_000;

interface UseDeliveryPollingProps {
  isFocused: boolean;
  hasPendingDelivery: boolean;
}

// Asks for the roster again while an email is queued or sending and the screen is in focus, for a bounded time.
const useDeliveryPolling = ({ isFocused, hasPendingDelivery }: UseDeliveryPollingProps) => {
  // Each coming into focus, invite or resend opens a new window; only the window's own timer closes it.
  const [openedWindow, setOpenedWindow] = useState(0);
  const [closedWindow, setClosedWindow] = useState(-1);
  const [wasFocused, setWasFocused] = useState(isFocused);
  if (isFocused !== wasFocused) {
    setWasFocused(isFocused);
    if (isFocused) setOpenedWindow((window) => window + 1);
  }

  useEffect(() => {
    const timer = setTimeout(() => setClosedWindow(openedWindow), DELIVERY_POLL_WINDOW_MS);

    return () => clearTimeout(timer);
  }, [openedWindow]);

  const isPolling = isFocused && closedWindow !== openedWindow && hasPendingDelivery;

  useGetMembersQuery(useSpaceArg(), { pollingInterval: isPolling ? DELIVERY_POLL_INTERVAL_MS : 0, skip: !isPolling });

  return { watch: useCallback(() => setOpenedWindow((window) => window + 1), []) };
};

export default useDeliveryPolling;
