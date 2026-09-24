import { useRef, useState } from 'react';

import { useSessionGuard } from '@redux/hooks';
import { getErrorMessage } from '@shared/utils';

interface UnwrappableResult {
  unwrap: () => Promise<unknown>;
}

const useConfirmAction = () => {
  const isRunningRef = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captureSession = useSessionGuard();

  const run = async (action: () => UnwrappableResult, onSuccess: () => void) => {
    // State updates land a render late, so a second tap in the same frame would still see isPending false.
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    setIsPending(true);
    setError(null);

    const isSessionCurrent = captureSession();

    try {
      await action().unwrap();

      if (isSessionCurrent()) onSuccess();
    } catch (actionError) {
      if (isSessionCurrent()) setError(getErrorMessage(actionError));
    } finally {
      isRunningRef.current = false;
      setIsPending(false);
    }
  };

  const resetError = () => setError(null);

  return { run, isPending, error, resetError };
};

export default useConfirmAction;
