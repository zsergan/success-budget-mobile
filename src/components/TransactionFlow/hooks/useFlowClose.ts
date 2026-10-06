import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAppDispatch, useAppStore } from '@redux/hooks';
import { hasUnsavedChanges, selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import { closed, editLeft, panelClosed } from '@redux/state/transactionFlow/slice';

const confirmDiscard = (isEdit: boolean, onDiscard: () => void) =>
  Alert.alert(
    isEdit ? 'Discard changes?' : 'Discard transaction?',
    isEdit ? 'Your edits to this transaction will be lost.' : 'The amount and details you entered will be lost.',
    [
      { text: 'Discard', style: 'destructive', onPress: onDiscard },
      { text: 'Keep editing', style: 'cancel', isPreferred: true },
    ],
  );

// One set of rules for every view: ✕, a swipe and the backdrop close the whole flow; Back steps one view back.
// Unsaved changes ask first, and nothing closes while a write runs.
const useFlowClose = () => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const getFlow = useCallback(() => {
    const flow = selectTransactionFlow(store.getState());

    return flow && !flow.isSaving ? flow : null;
  }, [store]);

  const requestClose = useCallback(() => {
    const flow = getFlow();
    if (!flow) return;

    const close = () => dispatch(closed());

    if (hasUnsavedChanges(flow)) confirmDiscard(flow.saved !== null, close);
    else close();
  }, [dispatch, getFlow]);

  const back = useCallback(() => {
    const flow = getFlow();
    if (!flow) return;

    if (flow.view.name === 'categories' || flow.view.name === 'dateTime') {
      dispatch(panelClosed());
    } else if (flow.view.name === 'edit') {
      const leave = () => dispatch(editLeft());

      if (hasUnsavedChanges(flow)) confirmDiscard(true, leave);
      else leave();
    } else {
      requestClose();
    }
  }, [dispatch, getFlow, requestClose]);

  return { requestClose, back };
};

export default useFlowClose;
