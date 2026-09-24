import { useRef, useState } from 'react';

import { useAppSelector, useAppStore, useSessionGuard } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { getErrorMessage } from '@shared/utils';

interface UnwrappableResult {
  unwrap: () => Promise<unknown>;
}

interface ConfirmRequest<T> {
  target: T;
  spaceId: number;
  sessionKey: number;
  isSessionCurrent: () => boolean;
}

interface ConfirmState<T> {
  request: ConfirmRequest<T> | null;
  isPending: boolean;
  error: string | null;
}

const IDLE = { request: null, isPending: false, error: null };

const useConfirmAction = <T>() => {
  const store = useAppStore();
  const captureSession = useSessionGuard();
  const sessionKey = useAppSelector((state) => state.auth.sessionKey);
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const [state, setState] = useState<ConfirmState<T>>(IDLE);
  const runningRef = useRef<ConfirmRequest<T> | null>(null);

  const { request } = state;
  const isRequestCurrent = request !== null && request.spaceId === spaceId && request.sessionKey === sessionKey;

  // A space switch or logout drops the dialog even mid-request; the user-facing cancel lock does not apply.
  if (request && !isRequestCurrent) {
    setState(IDLE);
  }

  const open = (target: T) => {
    if (spaceId === null) return;

    const next = { target, spaceId, sessionKey, isSessionCurrent: captureSession() };

    setState({ request: next, isPending: false, error: null });
  };

  const cancel = () => setState((current) => (current.isPending ? current : IDLE));

  const confirm = async (action: (target: T, spaceId: number) => UnwrappableResult) => {
    const operation = isRequestCurrent ? request : null;

    // State updates land a render late, so a second tap in the same frame would still see isPending false.
    if (!operation || runningRef.current === operation) return;

    const isOperationCurrent = () =>
      operation.isSessionCurrent() && selectCurrentSpaceId(store.getState()) === operation.spaceId;

    if (!isOperationCurrent()) return;

    const settle = (next: ConfirmState<T>) =>
      setState((current) => (current.request === operation && isOperationCurrent() ? next : current));

    runningRef.current = operation;
    settle({ request: operation, isPending: true, error: null });

    try {
      await action(operation.target, operation.spaceId).unwrap();
      settle(IDLE);
    } catch (actionError) {
      settle({ request: operation, isPending: false, error: getErrorMessage(actionError) });
    } finally {
      if (runningRef.current === operation) runningRef.current = null;
    }
  };

  return {
    target: isRequestCurrent ? request.target : null,
    isPending: isRequestCurrent && state.isPending,
    error: isRequestCurrent ? state.error : null,
    open,
    cancel,
    confirm,
  };
};

export type ConfirmAction<T> = ReturnType<typeof useConfirmAction<T>>;

export default useConfirmAction;
