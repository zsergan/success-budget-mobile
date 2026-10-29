import { useRef, useState } from 'react';

import type { ToastMessage } from '@components/Toast/message';
import { useAppSelector, useAppStore, useSessionGuard } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { getErrorMessage } from '@shared/utils';
import useToast from './useToast';

interface UnwrappableResult<R> {
  unwrap: () => Promise<R>;
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
  const toast = useToast();
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

  // `completed` describes what the request did; it is shown once the dialog has finished closing, if the user is still
  // on the screen, session and space it was asked in.
  const confirm = async <R>(
    action: (target: T, spaceId: number) => UnwrappableResult<R>,
    completed?: (result: R, target: T) => ToastMessage,
  ) => {
    const operation = isRequestCurrent ? request : null;

    // State updates land a render late, so a second tap in the same frame would still see isPending false.
    if (!operation || runningRef.current === operation) return;

    const isOperationCurrent = () =>
      operation.isSessionCurrent() && selectCurrentSpaceId(store.getState()) === operation.spaceId;

    if (!isOperationCurrent()) return;

    const settle = (next: ConfirmState<T>) =>
      setState((current) => (current.request === operation && isOperationCurrent() ? next : current));

    const ticket = toast.begin();
    runningRef.current = operation;
    settle({ request: operation, isPending: true, error: null });

    try {
      const result = await action(operation.target, operation.spaceId).unwrap();
      if (completed && isOperationCurrent()) ticket.showAfterSheetsClose(completed(result, operation.target));
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
