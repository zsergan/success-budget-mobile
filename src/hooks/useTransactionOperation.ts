import { useCallback, useRef, useState } from 'react';

import { useAppDispatch } from '@redux/hooks';
import type { OperationMemory, OperationOutcome, TransactionRequest } from '@redux/state/transaction/operations';
import { submitTransactionRequest } from '@redux/state/transaction/operations';

type RequestType = TransactionRequest['type'];

// `ignored`: another write of this draft is still running; the caller shows nothing for it.
export type TransactionSubmitOutcome<T extends RequestType> = OperationOutcome<T> | { status: 'ignored' };

const IGNORED = { status: 'ignored' } as const;

// One instance per draft: it remembers the draft's unsettled attempt, so a retry or a changed save
// never sends a second write the server may already have applied. Call reset() when a new draft starts.
const useTransactionOperation = () => {
  const dispatch = useAppDispatch();
  const memoryRef = useRef<OperationMemory | null>(null);
  const lastRequestRef = useRef<TransactionRequest | null>(null);
  // A ref, not state: two taps in one frame both run before any re-render could disable the button.
  const isBusyRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);

  const submit = useCallback(
    async <T extends RequestType>(
      request: Extract<TransactionRequest, { type: T }>,
    ): Promise<TransactionSubmitOutcome<T>> => {
      if (isBusyRef.current) return IGNORED;

      isBusyRef.current = true;
      lastRequestRef.current = request;
      setIsRunning(true);

      try {
        const { outcome, memory } = await dispatch(submitTransactionRequest(request, memoryRef.current));

        memoryRef.current = memory;

        return outcome;
      } finally {
        isBusyRef.current = false;
        setIsRunning(false);
      }
    },
    [dispatch],
  );

  // Resends the last request as it was, so it reuses the same operation and key.
  const retry = useCallback(
    (): Promise<TransactionSubmitOutcome<RequestType>> =>
      lastRequestRef.current ? submit(lastRequestRef.current) : Promise.resolve(IGNORED),
    [submit],
  );

  const reset = useCallback(() => {
    if (isBusyRef.current) return;

    memoryRef.current = null;
    lastRequestRef.current = null;
  }, []);

  return { submit, retry, reset, isRunning };
};

export default useTransactionOperation;
