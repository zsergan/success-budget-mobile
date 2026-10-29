import { useCallback, useEffect, useRef } from 'react';

import type { TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import type { ToastTicket } from '@components/Toast';
import { useToast } from '@hooks';
import type { ConfirmLock } from '@hooks/useConfirmation';
import { useAppDispatch, useAppSelector, useAppStore } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { DeleteOutcome } from '@redux/state/transactionFlow/thunks';
import { deleteTransaction, openTransactionDetails } from '@redux/state/transactionFlow/thunks';
import { deleteMessage, deleteSubject } from './deleteMessage';

// One delete for a list row, the details and the form: the same confirmation, asked through its owner's lock, then a
// write the row or the sheet waits for. A sheet still waiting on it when the answer comes explains a failure in place;
// otherwise a toast does, with the next step. What the delete did shows once the sheets it closed have gone.
const useTransactionDelete = (confirmLock: ConfirmLock) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const toast = useToast();
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  // A toast's Retry or Check status runs the delete again without asking; the ref lets the delete offer itself.
  const runRef = useRef<(transaction: TransactionModel, spaceId: number) => Promise<void>>(async () => {});

  const report = useCallback(
    (
      ticket: ToastTicket,
      { result, isShownInFlow }: DeleteOutcome,
      transaction: TransactionModel,
      spaceId: number,
      doneText: string,
    ) => {
      const subject = deleteSubject(transaction.id);
      const again = { onPress: () => void runRef.current(transaction, spaceId) };

      if (result === 'stale') return;
      ticket.resolve(subject);

      if (result === 'deleted') {
        ticket.showAfterSheetsClose({ tone: 'success', text: doneText, subject });
      } else if (result === 'gone') {
        ticket.showAfterSheetsClose({ tone: 'info', text: 'This transaction is no longer available', subject });
      } else if (isShownInFlow) {
        return;
      } else if (result === 'conflict') {
        ticket.show({
          tone: 'warning',
          text: 'Not deleted — this transaction changed',
          subject,
          action: { label: 'View', onPress: () => dispatch(openTransactionDetails({ spaceId, transaction })) },
        });
      } else if (result === 'uncertain') {
        ticket.show({
          tone: 'error',
          text: 'Couldn’t confirm the delete',
          subject,
          action: { label: 'Check status', ...again },
        });
      } else {
        ticket.show({
          tone: 'error',
          text: 'Couldn’t delete transaction',
          subject,
          action: { label: 'Retry', ...again },
        });
      }
    },
    [dispatch],
  );

  // The ticket is taken as the delete starts: its toast, and the actions on it, belong to the screen, space and
  // session it ran in.
  const runDelete = useCallback(
    async (transaction: TransactionModel, spaceId = currentSpaceId, doneText = 'Transaction deleted') => {
      if (spaceId === null) return;

      const ticket = toast.begin();
      const outcome = await dispatch(deleteTransaction({ spaceId, transaction }));
      report(ticket, outcome, transaction, spaceId, doneText);
    },
    [dispatch, toast, report, currentSpaceId],
  );

  useEffect(() => {
    runRef.current = runDelete;
  }, [runDelete]);

  // `onSettled` runs when the confirmation closes either way, or at once when there is nothing to delete or another
  // confirmation is open.
  const requestDelete = useCallback(
    (transaction: TransactionModel, onSettled?: () => void) => {
      const spaceId = currentSpaceId;
      if (isInitialBalance(transaction) || spaceId === null) {
        onSettled?.();
        return;
      }
      const sessionKey = store.getState().auth.sessionKey;

      const isAsked = confirmLock.ask((settle) => {
        const close = () => {
          const isCurrent = settle();
          onSettled?.();
          return isCurrent;
        };

        return {
          title: 'Delete transaction?',
          description: deleteMessage(transaction, currencyCode),
          primaryAction: {
            label: 'Delete transaction',
            tone: 'danger',
            onPress: () => {
              if (!close()) return;
              const { auth, space } = store.getState();
              if (auth.sessionKey === sessionKey && space.currentSpaceId === spaceId) {
                void runDelete(transaction, spaceId);
              }
            },
          },
          onCancel: close,
        };
      });
      if (!isAsked) onSettled?.();
    },
    [confirmLock, currencyCode, runDelete, currentSpaceId, store],
  );

  const retryDelete = useCallback((transaction: TransactionModel) => runDelete(transaction), [runDelete]);

  // Undo of a create just made: the same delete, without asking, named for what the user did.
  const undoCreate = useCallback(
    (transaction: TransactionModel) => runDelete(transaction, currentSpaceId, 'Transaction removed'),
    [runDelete, currentSpaceId],
  );

  return { requestDelete, retryDelete, undoCreate };
};

export default useTransactionDelete;
