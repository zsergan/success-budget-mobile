import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAppDispatch, useAppStore } from '@redux/hooks';
import { hasOpenSave, hasUnsavedChanges, selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import { closed, editLeft, panelClosed } from '@redux/state/transactionFlow/slice';
import type { ConfirmLock } from './useConfirmLock';

const confirmDiscard = (isEdit: boolean, onDiscard: () => void, settle: () => void) =>
  Alert.alert(
    isEdit ? 'Discard changes?' : 'Discard transaction?',
    isEdit ? 'Your edits to this transaction will be lost.' : 'The amount and details you entered will be lost.',
    [
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          settle();
          onDiscard();
        },
      },
      { text: 'Keep editing', style: 'cancel', isPreferred: true, onPress: settle },
    ],
  );

// Closing drops the draft, never a write already sent: an unconfirmed one is settled in the background, and one that
// ran out stays on Home until the user sends or discards it.
const confirmLeavingSave = (notice: 'saveUnknown' | 'saveExpired', onClose: () => void, settle: () => void) =>
  Alert.alert(
    notice === 'saveUnknown' ? 'Close without confirmation?' : 'Close without sending?',
    notice === 'saveUnknown'
      ? 'It may already be saved. The app keeps checking and never saves it twice; edits made since are lost.'
      : 'It stays on Home, where you can send it later or discard it; edits made since are lost.',
    [
      {
        text: 'Close',
        style: 'destructive',
        onPress: () => {
          settle();
          onClose();
        },
      },
      { text: 'Keep open', style: 'cancel', isPreferred: true, onPress: settle },
    ],
  );

// One set of rules for every view: ✕, a swipe and the backdrop close the whole flow; Back steps one view back.
// Unsaved changes ask first, and nothing closes while a write runs or a confirmation is open.
const useFlowClose = (confirmLock: ConfirmLock) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const getFlow = useCallback(() => {
    const flow = selectTransactionFlow(store.getState());

    return flow && !flow.isSaving && !confirmLock.isLocked() ? flow : null;
  }, [store, confirmLock]);

  const requestClose = useCallback(() => {
    const flow = getFlow();
    if (!flow) return;

    const close = () => {
      if (getFlow()?.draftId === flow.draftId) dispatch(closed());
    };

    if (hasOpenSave(flow))
      confirmLock.ask((settle) => confirmLeavingSave(flow.notice as 'saveUnknown' | 'saveExpired', close, settle));
    else if (hasUnsavedChanges(flow)) confirmLock.ask((settle) => confirmDiscard(flow.saved !== null, close, settle));
    else close();
  }, [dispatch, getFlow, confirmLock]);

  const back = useCallback(() => {
    const flow = getFlow();
    if (!flow) return;

    if (flow.view.name === 'categories' || flow.view.name === 'dateTime') {
      dispatch(panelClosed());
    } else if (flow.view.name === 'edit') {
      const leave = () => {
        if (getFlow()?.draftId === flow.draftId) dispatch(editLeft());
      };

      if (flow.notice === 'saveUnknown') confirmLock.ask((settle) => confirmLeavingSave('saveUnknown', leave, settle));
      else if (hasUnsavedChanges(flow)) confirmLock.ask((settle) => confirmDiscard(true, leave, settle));
      else leave();
    } else {
      requestClose();
    }
  }, [dispatch, getFlow, requestClose, confirmLock]);

  return { requestClose, back };
};

export default useFlowClose;
