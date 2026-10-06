import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import type { TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import { useAlert } from '@hooks';
import { useAppDispatch, useAppSelector, useAppStore } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import { selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import { deleteTransaction, openTransactionDetails } from '@redux/state/transactionFlow/thunks';
import { deleteMessage } from './deleteMessage';

// One delete for a list row, the details and the form: the same confirmation, then a write the row or the sheet
// waits for. The sheet explains its own failures in place; a row's come as a toast with the next step.
const useTransactionDelete = () => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const { addAlert } = useAlert();
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  // Retry from a toast runs the delete again without asking; the ref lets the delete offer itself.
  const runRef = useRef<(transaction: TransactionModel) => Promise<void>>(async () => {});

  const runDelete = useCallback(
    async (transaction: TransactionModel) => {
      if (spaceId === null) return;

      const isInSheet = selectTransactionFlow(store.getState())?.saved?.id === transaction.id;
      const result = await dispatch(deleteTransaction({ spaceId, transaction }));

      if (result === 'deleted') {
        addAlert('Transaction deleted');
      } else if (!isInSheet && result === 'conflict') {
        addAlert('This transaction was changed by someone else', {
          label: 'Open',
          onPress: () => dispatch(openTransactionDetails({ spaceId, transaction })),
        });
      } else if (!isInSheet && result === 'failed') {
        addAlert('Couldn’t delete transaction', { label: 'Retry', onPress: () => void runRef.current(transaction) });
      }
    },
    [dispatch, store, addAlert, spaceId],
  );

  useEffect(() => {
    runRef.current = runDelete;
  }, [runDelete]);

  // `onSettled` runs when the confirmation closes either way, e.g. to slide a row back.
  const requestDelete = useCallback(
    (transaction: TransactionModel, onSettled?: () => void) => {
      if (isInitialBalance(transaction)) return;

      Alert.alert(
        'Delete transaction?',
        deleteMessage(transaction, currencyCode),
        [
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              onSettled?.();
              void runDelete(transaction);
            },
          },
          { text: 'Cancel', style: 'cancel', isPreferred: true, onPress: onSettled },
        ],
        { onDismiss: onSettled },
      );
    },
    [currencyCode, runDelete],
  );

  return { requestDelete, retryDelete: runDelete };
};

export default useTransactionDelete;
