import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { StackActions, usePreventRemove } from '@react-navigation/native';
import type { Edge } from 'react-native-safe-area-context';

import type { CategoryModel } from '@api/models';
import CategoryEditorSheet from '@components/CategoryEditor/CategoryEditorSheet';
import ConfirmationSheet from '@components/ConfirmationSheet/ConfirmationSheet';
import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import ScreenFrame from '@components/ScreenFrame/ScreenFrame';
import DateTimePanel from '@components/TransactionFlow/DateTimePanel/DateTimePanel';
import useFlowClose from '@components/TransactionFlow/hooks/useFlowClose';
import useFlowConfirmation from '@components/TransactionFlow/hooks/useFlowConfirmation';
import useFlowSave from '@components/TransactionFlow/hooks/useFlowSave';
import TransactionEditor from '@components/TransactionFlow/TransactionEditor/TransactionEditor';
import useTransactionDelete from '@components/TransactionFlow/useTransactionDelete';
import { useSheetPresence } from '@hooks';
import { useAppDispatch } from '@redux/hooks';
import type { FlowAway } from '@redux/state/transactionFlow/slice';
import {
  awayEnded,
  awayStarted,
  categoryCreated,
  dateTimeOpened,
  panelClosed,
} from '@redux/state/transactionFlow/slice';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import { afterKeyboardHides } from '@shared/utils';
import useEditorFlow from './hooks/useEditorFlow';

import styles from './style';

// The form's own footer keeps the bottom inset, and drops it above the keyboard.
const EDGES: Edge[] = ['top', 'left', 'right'];

interface Props extends RootStackScreenProps<ScreenNames.TRANSACTION_EDITOR_SCREEN> {}

// Shows the form of the flow it was opened for; the flow owns the draft, so the route stays the same one when the
// draft is replaced by the latest version or a recovered create turns into an edit.
const TransactionEditorScreen = ({ navigation, route }: Props) => {
  const dispatch = useAppDispatch();
  const { spaceId } = route.params;
  const { flow, getFlow: getOwnFlow } = useEditorFlow(spaceId);
  const save = useFlowSave();
  const { lock: confirmLock, confirmation } = useFlowConfirmation();
  const { back } = useFlowClose(confirmLock);
  const { requestDelete, retryDelete } = useTransactionDelete(confirmLock, { leavesScreen: true });

  // The form stays on screen while the route animates away after the flow left it.
  const [lastFlow, setLastFlow] = useState(flow);
  if (flow && flow !== lastFlow) setLastFlow(flow);
  const shown = flow ?? lastFlow;

  const isCreatingCategory = flow?.away === 'category';
  const { ref: categorySheetRef, settleDismiss: settleCategoryDismiss } = useSheetPresence(isCreatingCategory);

  // The date picker is a sheet over the form; what it showed stays in it while it closes.
  const picking = flow?.view.name === 'dateTime' ? flow.view.pending : null;
  const [lastPicking, setLastPicking] = useState(picking);
  if (picking !== null && picking !== lastPicking) setLastPicking(picking);
  const { ref: dateSheetRef, settleDismiss: settleDateDismiss } = useSheetPresence(picking !== null);

  // Header Back, Android Back and the swipe all ask the flow; the route goes only once the flow has let the form go.
  usePreventRemove(!!flow, back);

  // After the guard above has let go: a flow that ended or left the form takes the route with it, and whatever was
  // pushed over it (a new wallet), also when that was not the user's doing (a space switch, lost access).
  useEffect(() => {
    if (flow) return;

    const { routes } = navigation.getState();
    const index = routes.findIndex(({ key }) => key === route.key);
    if (index !== -1) navigation.dispatch(StackActions.pop(routes.length - index));
  }, [flow, navigation, route.key]);

  // A handler acts for the form only while nothing covers it and no write runs.
  const getIdleFlow = () => {
    const current = getOwnFlow();
    return current && !current.isSaving && !current.away && navigation.isFocused() ? current : null;
  };

  // The draft waits in the flow while a wallet or a category is created, and comes back with the new pick.
  const leaveFor = (target: FlowAway) => {
    const current = getIdleFlow();
    if (!current) return;

    const { draftId } = current;
    if (target === 'wallet') {
      dispatch(awayStarted({ draftId, target }));
      navigation.navigate(ScreenNames.ADD_WALLET_SCREEN, { id: 'new', forDraft: draftId });
    } else {
      afterKeyboardHides(() => dispatch(awayStarted({ draftId, target })));
    }
  };

  // The full list goes with the keyboard closed, so the form comes back without it.
  const openCategories = () => {
    if (!getIdleFlow()) return;

    Keyboard.dismiss();
    navigation.navigate(ScreenNames.TRANSACTION_CATEGORIES_SCREEN, { spaceId });
  };

  const openDate = () => {
    if (getIdleFlow()) afterKeyboardHides(() => dispatch(dateTimeOpened()));
  };

  // A swipe or the backdrop is a Cancel: the draft keeps its date.
  const handleDateDismiss = () => {
    if (settleDateDismiss() && getOwnFlow()?.view.name === 'dateTime') dispatch(panelClosed());
  };

  // A category created from the full list brings the form back into view with it.
  const handleCategorySaved = (category: CategoryModel) => {
    if (!flow) return;

    dispatch(
      categoryCreated({ draftId: flow.draftId, categoryId: category.id, transactionType: category.transactionType }),
    );
    if (!navigation.isFocused()) navigation.popTo(ScreenNames.TRANSACTION_EDITOR_SCREEN, route.params);
  };

  // Closing the category sheet without saving returns to the form as it was.
  const handleCategoryDismiss = () => {
    if (!settleCategoryDismiss()) return;
    const current = getOwnFlow();
    if (current?.away === 'category') dispatch(awayEnded({ draftId: current.draftId }));
  };

  return (
    <ScreenFrame edges={EDGES}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {shown?.draft && (
          <TransactionEditor
            flow={{ ...shown, draft: shown.draft }}
            onSave={save}
            onBack={back}
            onOpenCategories={openCategories}
            onOpenDate={openDate}
            onCreateWallet={() => leaveFor('wallet')}
            onCreateCategory={() => leaveFor('category')}
            onDelete={() => shown.saved && requestDelete(shown.saved)}
            onRetryDelete={() => shown.saved && retryDelete(shown.saved)}
          />
        )}
      </KeyboardAvoidingView>

      <BottomModal ref={dateSheetRef} fitContent onDismiss={handleDateDismiss}>
        {lastPicking !== null && (
          <DateTimePanel
            pending={picking ?? lastPicking}
            original={shown?.baseline?.timestamp ?? lastPicking}
            onCancel={() => dispatch(panelClosed())}
          />
        )}
      </BottomModal>

      <BottomModal ref={categorySheetRef} fitContent onDismiss={handleCategoryDismiss}>
        {shown?.draft && (
          <CategoryEditorSheet defaultTransactionType={shown.draft.transactionType} onSaved={handleCategorySaved} />
        )}
      </BottomModal>

      <ConfirmationSheet confirmation={confirmation} />
    </ScreenFrame>
  );
};

export default TransactionEditorScreen;
