import { useCallback, useEffect, useRef } from 'react';

import type { TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import { useAlert } from '@hooks';
import type { ConfirmLock } from '@hooks/useConfirmation';
import { useAppDispatch, useAppSelector, useAppStore } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import { selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import { deleteTransaction, openTransactionDetails } from '@redux/state/transactionFlow/thunks';
import { deleteMessage } from './deleteMessage';

// One delete for a list row, the details and the form: the same confirmation, asked through its owner's lock, then a
// write the row or the sheet waits for. The sheet explains its own failures in place; a row's come as a toast with
// the next step.
const useTransactionDelete = (confirmLock: ConfirmLock) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const { addAlert } = useAlert();
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  // Retry from a toast runs the delete again without asking; the ref lets the delete offer itself.
  const runRef = useRef<(transaction: TransactionModel, spaceId: number) => Promise<void>>(async () => {});

  // A toast's Retry and Open act on the record, space and session the delete ran in, and on nothing once the user
  // has moved on from them.
  const runDelete = useCallback(
    async (transaction: TransactionModel, spaceId = currentSpaceId) => {
      if (spaceId === null) return;

      const { sessionKey } = store.getState().auth;
      const isStillThere = () => {
        const { auth, space } = store.getState();
        return auth.sessionKey === sessionKey && space.currentSpaceId === spaceId;
      };
      const isInSheet = selectTransactionFlow(store.getState())?.saved?.id === transaction.id;
      const result = await dispatch(deleteTransaction({ spaceId, transaction }));

      if (!isStillThere()) return;

      if (result === 'deleted') {
        addAlert('Transaction deleted');
      } else if (!isInSheet && result === 'conflict') {
        addAlert('This transaction was changed by someone else', {
          label: 'Open',
          onPress: () => {
            if (isStillThere()) dispatch(openTransactionDetails({ spaceId, transaction }));
          },
        });
      } else if (!isInSheet && (result === 'failed' || result === 'uncertain')) {
        addAlert(result === 'uncertain' ? 'Couldn’t confirm the delete' : 'Couldn’t delete transaction', {
          label: 'Retry',
          onPress: () => {
            if (isStillThere()) void runRef.current(transaction, spaceId);
          },
        });
      }
    },
    [dispatch, store, addAlert, currentSpaceId],
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

  return { requestDelete, retryDelete };
};

export default useTransactionDelete;
