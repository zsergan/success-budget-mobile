import { useCallback, useMemo, useRef } from 'react';

import { useAppStore } from '@redux/hooks';
import { selectTransactionFlow } from '@redux/state/transactionFlow/selectors';

export interface ConfirmLock {
  isLocked: () => boolean;
  // Opens a confirmation unless one is already open; it calls `settle` once it closes, whichever way.
  ask: (open: (settle: () => void) => void) => void;
}

// One confirmation at a time over the flow: while one is open, the flow neither steps back nor asks again.
// The lock belongs to its draft, so a flow that ended under an open confirmation leaves the next one free.
const useConfirmLock = (): ConfirmLock => {
  const store = useAppStore();
  const lockedDraftIdRef = useRef<number | null>(null);

  const isLocked = useCallback(() => {
    const flow = selectTransactionFlow(store.getState());
    return !!flow && flow.draftId === lockedDraftIdRef.current;
  }, [store]);

  const ask = useCallback(
    (open: (settle: () => void) => void) => {
      const flow = selectTransactionFlow(store.getState());
      if (!flow || isLocked()) return;

      const { draftId } = flow;
      lockedDraftIdRef.current = draftId;
      open(() => {
        if (lockedDraftIdRef.current === draftId) lockedDraftIdRef.current = null;
      });
    },
    [store, isLocked],
  );

  return useMemo(() => ({ isLocked, ask }), [isLocked, ask]);
};

export default useConfirmLock;
