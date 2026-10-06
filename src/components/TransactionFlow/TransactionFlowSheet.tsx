import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import { useAppDispatch, useAppSelector, useAppStore } from '@redux/hooks';
import { hasUnsavedChanges, selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import type { TransactionFlow } from '@redux/state/transactionFlow/slice';
import { anotherStarted, closed } from '@redux/state/transactionFlow/slice';
import CategoriesPanel from './CategoriesPanel/CategoriesPanel';
import CreatedConfirmation from './CreatedConfirmation/CreatedConfirmation';
import DateTimePanel from './DateTimePanel/DateTimePanel';
import useFlowClose from './hooks/useFlowClose';
import useFlowSave from './hooks/useFlowSave';
import TransactionDetails from './TransactionDetails/TransactionDetails';
import TransactionEditor from './TransactionEditor/TransactionEditor';

// The one sheet for creating, viewing and editing a transaction. Its content follows the flow's view, so moving
// between views never stacks a second sheet, and ending the flow (also on a logout or a space switch) dismisses it.
const TransactionFlowSheet = () => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const sheetRef = useRef<BottomSheetModal>(null);
  const flow = useAppSelector(selectTransactionFlow);
  const save = useFlowSave();
  const { requestClose, back } = useFlowClose();

  // The content stays on screen while the sheet animates away after the flow ended.
  const [lastFlow, setLastFlow] = useState<TransactionFlow | null>(flow);
  if (flow && flow !== lastFlow) setLastFlow(flow);
  const shown = flow ?? lastFlow;

  const isVisible = !!flow && !flow.away;
  const isDismissingRef = useRef(false);

  useEffect(() => {
    if (isVisible) {
      isDismissingRef.current = false;
      sheetRef.current?.present();
    } else {
      isDismissingRef.current = true;
      sheetRef.current?.dismiss();
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });

    return () => subscription.remove();
  }, [isVisible, back]);

  // Only a swipe closes the sheet on its own; one we dismissed ourselves is not a close request.
  const handleDismiss = useCallback(() => {
    if (isDismissingRef.current) {
      isDismissingRef.current = false;
      return;
    }

    const current = selectTransactionFlow(store.getState());
    if (current && !current.away) dispatch(closed());
  }, [dispatch, store]);

  const isGuarded = !!flow && (flow.isSaving || hasUnsavedChanges(flow));

  const renderView = () => {
    if (!shown) return null;

    switch (shown.view.name) {
      case 'create':
      case 'edit':
        return shown.draft ? (
          <TransactionEditor
            flow={{ ...shown, draft: shown.draft }}
            onSave={save}
            onBack={back}
            onClose={requestClose}
            onCreateWallet={() => undefined}
            onCreateCategory={() => undefined}
          />
        ) : null;
      case 'details':
        return shown.saved ? (
          <TransactionDetails spaceId={shown.spaceId} saved={shown.saved} onClose={requestClose} />
        ) : null;
      case 'categories':
        return shown.draft ? (
          <CategoriesPanel
            transactionType={shown.draft.transactionType}
            selectedId={shown.draft.categoryId}
            onBack={back}
            onClose={requestClose}
          />
        ) : null;
      case 'dateTime':
        return <DateTimePanel pending={shown.view.pending} onBack={back} onClose={requestClose} />;
      case 'created':
        return shown.created ? (
          <CreatedConfirmation
            created={shown.created}
            onAddAnother={() => dispatch(anotherStarted({ now: new Date().toISOString() }))}
            onDone={requestClose}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <BottomModal
      ref={sheetRef}
      dynamicSizing
      enablePanDownToClose={!isGuarded}
      onBackdropPress={requestClose}
      onDismiss={handleDismiss}
    >
      {renderView()}
    </BottomModal>
  );
};

export default TransactionFlowSheet;
