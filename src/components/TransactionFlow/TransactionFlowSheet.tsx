import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { CategoryModel } from '@api/models';
import CategoryEditorSheet from '@components/CategoryEditor/CategoryEditorSheet';
import ConfirmationSheet from '@components/ConfirmationSheet/ConfirmationSheet';
import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import { useBackPress, useSheetPresence } from '@hooks';
import { useAppDispatch, useAppSelector, useAppStore } from '@redux/hooks';
import { hasOpenSave, hasUnsavedChanges, selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import type { FlowAway, TransactionFlow } from '@redux/state/transactionFlow/slice';
import {
  anotherStarted,
  autoCloseStopped,
  awayEnded,
  awayStarted,
  categoryCreated,
  closed,
} from '@redux/state/transactionFlow/slice';
import { checkFlowRecord, openTransactionDetails } from '@redux/state/transactionFlow/thunks';
import { ScreenNames } from '@shared/enums';
import type { RootStackParamList } from '@shared/types';
import CategoriesPanel from './CategoriesPanel/CategoriesPanel';
import CreatedConfirmation from './CreatedConfirmation/CreatedConfirmation';
import DateTimePanel from './DateTimePanel/DateTimePanel';
import useFlowClose from './hooks/useFlowClose';
import useFlowConfirmation from './hooks/useFlowConfirmation';
import useFlowSave from './hooks/useFlowSave';
import useTransactionDelete from './useTransactionDelete';
import RecordGone from './RecordGone/RecordGone';
import TransactionDetails from './TransactionDetails/TransactionDetails';
import TransactionEditor from './TransactionEditor/TransactionEditor';

// The one sheet for creating, viewing and editing a transaction. Its content follows the flow's view, so moving
// between views never stacks a second sheet, and ending the flow (also on a logout or a space switch) dismisses it.
const TransactionFlowSheet = () => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const flow = useAppSelector(selectTransactionFlow);
  const save = useFlowSave();
  const { lock: confirmLock, confirmation } = useFlowConfirmation();
  const { requestClose, back } = useFlowClose(confirmLock);
  const { requestDelete, retryDelete, undoCreate: deleteCreated } = useTransactionDelete(confirmLock);

  // The content stays on screen while the sheet animates away after the flow ended.
  const [lastFlow, setLastFlow] = useState<TransactionFlow | null>(flow);
  if (flow && flow !== lastFlow) setLastFlow(flow);
  const shown = flow ?? lastFlow;

  const isVisible = !!flow && !flow.away;
  const isCreatingCategory = flow?.away === 'category';
  const { ref: sheetRef, settleDismiss, isDismissing } = useSheetPresence(isVisible);
  const { ref: categorySheetRef, settleDismiss: settleCategoryDismiss } = useSheetPresence(isCreatingCategory);
  const asksOnReturnRef = useRef(false);

  useBackPress(isVisible, back);

  // Open details may have changed elsewhere while the app was away; a form keeps its draft and meets a conflict on save.
  useEffect(() => {
    let wasInBackground = false;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        wasInBackground = true;
      } else if (state === 'active' && wasInBackground) {
        wasInBackground = false;
        const current = selectTransactionFlow(store.getState());
        if (current?.view.name === 'details' && !current.isSaving && current.check !== 'pending') {
          void dispatch(checkFlowRecord());
        }
      }
    });

    return () => subscription.remove();
  }, [dispatch, store]);

  // Only a swipe closes the sheet on its own; one we dismissed ourselves is not a close request.
  const handleDismiss = useCallback(() => {
    asksOnReturnRef.current = false;
    if (!settleDismiss()) return;

    const current = selectTransactionFlow(store.getState());
    if (current && !current.away) dispatch(closed());
  }, [dispatch, store, settleDismiss]);

  // A swipe follows the same rules as ✕ and the backdrop: it waits for a running write and asks before discarding,
  // once the sheet is back in place.
  const keepOpen = useCallback(() => {
    const current = selectTransactionFlow(store.getState());
    if (isDismissing() || !current || current.away) return false;
    if (current.isSaving || confirmLock.isLocked()) return true;
    if (!hasUnsavedChanges(current) && !hasOpenSave(current)) return false;

    asksOnReturnRef.current = true;
    return true;
  }, [store, isDismissing, confirmLock]);

  const handleKeptOpen = useCallback(() => {
    if (!asksOnReturnRef.current) return;

    asksOnReturnRef.current = false;
    requestClose();
  }, [requestClose]);

  // Creating a wallet or a category hides the sheet; the draft waits in the flow and comes back with the new pick.
  const leaveFor = (target: FlowAway) => {
    const current = selectTransactionFlow(store.getState());
    if (!current || current.isSaving) return;

    dispatch(awayStarted({ draftId: current.draftId, target }));
    if (target === 'wallet')
      navigation.navigate(ScreenNames.ADD_WALLET_SCREEN, { id: 'new', forDraft: current.draftId });
  };

  const handleCategorySaved = (category: CategoryModel) => {
    if (!flow) return;

    dispatch(
      categoryCreated({ draftId: flow.draftId, categoryId: category.id, transactionType: category.transactionType }),
    );
  };

  // Closing the category sheet without saving returns to the form as it was.
  const handleCategoryDismiss = () => {
    if (!settleCategoryDismiss()) return;
    const current = selectTransactionFlow(store.getState());
    if (current?.away === 'category') dispatch(awayEnded({ draftId: current.draftId }));
  };

  // Undo deletes the record the create made, at the version it came back with.
  const undoCreate = () => {
    const current = selectTransactionFlow(store.getState());
    if (!current?.created || current.isSaving) return;

    void deleteCreated(current.created.transaction);
  };

  // Leaves the confirmation for the record: Show for its row in Transactions, Open for its latest version.
  const leaveCreated = (target: 'row' | 'record') => {
    const current = selectTransactionFlow(store.getState());
    if (!current?.created || current.isSaving) return;

    const { spaceId, created } = current;
    const { id, timestamp } = created.transaction;
    dispatch(closed());

    if (target === 'record') {
      dispatch(openTransactionDetails({ spaceId, transaction: created.transaction }));
    } else {
      navigation.navigate(ScreenNames.HOME_SCREEN, {
        screen: ScreenNames.TRANSACTIONS_TAB,
        params: { reveal: { spaceId, transactionId: id, timestamp } },
      });
    }
  };

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
            onCreateWallet={() => leaveFor('wallet')}
            onCreateCategory={() => leaveFor('category')}
            onDelete={() => shown.saved && requestDelete(shown.saved)}
            onRetryDelete={() => shown.saved && retryDelete(shown.saved)}
          />
        ) : null;
      case 'details':
        return shown.saved ? (
          <TransactionDetails
            flow={{ ...shown, saved: shown.saved }}
            onClose={requestClose}
            onDelete={() => shown.saved && requestDelete(shown.saved)}
            onRetryDelete={() => shown.saved && retryDelete(shown.saved)}
          />
        ) : null;
      case 'gone':
        return <RecordGone onClose={requestClose} />;
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
        return (
          <DateTimePanel
            pending={shown.view.pending}
            original={shown.baseline?.timestamp ?? shown.view.pending}
            onBack={back}
            onClose={requestClose}
          />
        );
      case 'created':
        return shown.created ? (
          <CreatedConfirmation
            flow={{ ...shown, created: shown.created }}
            onUndo={undoCreate}
            onShow={() => leaveCreated('row')}
            onOpenRecord={() => leaveCreated('record')}
            onAddAnother={() => dispatch(anotherStarted({ now: new Date().toISOString() }))}
            onDone={requestClose}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <>
      <BottomModal
        ref={sheetRef}
        fitContent
        onHandleTouch={() => {
          if (flow?.view.name === 'created') dispatch(autoCloseStopped({ draftId: flow.draftId }));
        }}
        isDismissible={!flow?.isSaving}
        shouldKeepOpen={keepOpen}
        onKeptOpen={handleKeptOpen}
        onBackdropPress={requestClose}
        onDismiss={handleDismiss}
      >
        {renderView()}
      </BottomModal>

      <BottomModal ref={categorySheetRef} fitContent onDismiss={handleCategoryDismiss}>
        {shown?.draft && (
          <CategoryEditorSheet defaultTransactionType={shown.draft.transactionType} onSaved={handleCategorySaved} />
        )}
      </BottomModal>

      <ConfirmationSheet confirmation={confirmation} />
    </>
  );
};

export default TransactionFlowSheet;
