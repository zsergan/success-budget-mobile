import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { CategoryModel } from '@api/models';
import CategoryEditorSheet, { CATEGORY_EDITOR_SNAP_POINT } from '@components/CategoryEditor/CategoryEditorSheet';
import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import { useAppDispatch, useAppSelector, useAppStore } from '@redux/hooks';
import { hasUnsavedChanges, selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import type { FlowAway, TransactionFlow } from '@redux/state/transactionFlow/slice';
import { anotherStarted, awayEnded, awayStarted, categoryCreated, closed } from '@redux/state/transactionFlow/slice';
import { ScreenNames } from '@shared/enums';
import type { RootStackParamList } from '@shared/types';
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const sheetRef = useRef<BottomSheetModal>(null);
  const categorySheetRef = useRef<BottomSheetModal>(null);
  const flow = useAppSelector(selectTransactionFlow);
  const save = useFlowSave();
  const { requestClose, back } = useFlowClose();

  // The content stays on screen while the sheet animates away after the flow ended.
  const [lastFlow, setLastFlow] = useState<TransactionFlow | null>(flow);
  if (flow && flow !== lastFlow) setLastFlow(flow);
  const shown = flow ?? lastFlow;

  const isVisible = !!flow && !flow.away;
  const isCreatingCategory = flow?.away === 'category';
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
    if (isCreatingCategory) categorySheetRef.current?.present();
    else categorySheetRef.current?.dismiss();
  }, [isCreatingCategory]);

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
    const current = selectTransactionFlow(store.getState());
    if (current?.away === 'category') dispatch(awayEnded({ draftId: current.draftId }));
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
    <>
      <BottomModal
        ref={sheetRef}
        dynamicSizing
        enablePanDownToClose={!isGuarded}
        onBackdropPress={requestClose}
        onDismiss={handleDismiss}
      >
        {renderView()}
      </BottomModal>

      <BottomModal ref={categorySheetRef} snapPoint={CATEGORY_EDITOR_SNAP_POINT} onDismiss={handleCategoryDismiss}>
        {shown?.draft && (
          <CategoryEditorSheet defaultTransactionType={shown.draft.transactionType} onSaved={handleCategorySaved} />
        )}
      </BottomModal>
    </>
  );
};

export default TransactionFlowSheet;
