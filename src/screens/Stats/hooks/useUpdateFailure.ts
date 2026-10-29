import { useEffect, useRef, useState } from 'react';

import { useToast } from '@hooks';

const SUBJECT = 'stats-update-failed';

interface Props {
  // The failed attempt, or null while nothing failed or the screen shows a failure of its own.
  attempt: string | null;
  isUpdating: boolean;
  retryFailed: () => void;
}

// A failed refresh keeps the earlier figures. Each failed attempt gets one toast; the banner stays while the figures
// are out of date, so closing the toast never makes them look current. Recovery or another selection takes the toast.
const useUpdateFailure = ({ attempt, isUpdating, retryFailed }: Props) => {
  const toast = useToast();
  const [isRetrying, setRetrying] = useState(false);
  const retryRef = useRef(retryFailed);

  useEffect(() => {
    retryRef.current = retryFailed;
  });

  if (isRetrying && !isUpdating) setRetrying(false);

  useEffect(() => {
    if (attempt === null) return;

    const ticket = toast.begin();
    ticket.show({
      tone: 'error',
      text: 'Couldn’t update statistics',
      subject: SUBJECT,
      action: {
        label: 'Retry',
        onPress: () => {
          setRetrying(true);
          retryRef.current();
        },
      },
    });

    return () => ticket.resolve(SUBJECT);
  }, [attempt, toast]);

  const retry = () => {
    setRetrying(true);
    retryFailed();
  };

  return { isShown: attempt !== null || isRetrying, isRetrying, retry };
};

export default useUpdateFailure;
