import { useCallback, useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import type { Edge } from 'react-native-safe-area-context';

import ConfirmationSheet from '@components/ConfirmationSheet/ConfirmationSheet';
import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import ScreenFrame from '@components/ScreenFrame/ScreenFrame';
import DateTimePanel from '@screens/TransactionEditor/components/DateTimePanel/DateTimePanel';
import useFlowClose from '@components/TransactionFlow/hooks/useFlowClose';
import useFlowConfirmation from '@components/TransactionFlow/hooks/useFlowConfirmation';
import useFlowSave from './hooks/useFlowSave';
import TransactionEditor from '@screens/TransactionEditor/components/TransactionEditor/TransactionEditor';
import useTransactionDelete from '@components/TransactionFlow/useTransactionDelete';
import { useSheetPresence } from '@hooks';
import { useAppDispatch } from '@redux/hooks';
import { awayStarted, dateTimeOpened, panelClosed } from '@redux/state/transactionFlow/slice';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import CategoryCreationSheet from './components/CategoryCreation/CategoryCreationSheet';
import useCategoryCreation from './components/CategoryCreation/useCategoryCreation';
import removeRoute from './hooks/removeRoute';
import useEditorFlow from './hooks/useEditorFlow';
import usePickerDelay from './hooks/usePickerDelay';

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

  // The date picker is a sheet over the form; what it showed stays in it while it closes.
  const picking = flow?.view.name === 'dateTime' ? flow.view.pending : null;
  const [lastPicking, setLastPicking] = useState(picking);
  if (picking !== null && picking !== lastPicking) setLastPicking(picking);
  const { ref: dateSheetRef, settleDismiss: settleDateDismiss } = useSheetPresence(picking !== null);

  // The form acts on a tap only while nothing covers it and no write runs.
  const getIdleFlow = useCallback(() => {
    const current = getOwnFlow();
    const isIdle = current && !current.isSaving && !current.away && current.view.name !== 'dateTime';

    return isIdle && navigation.isFocused() ? current : null;
  }, [getOwnFlow, navigation]);

  const delay = usePickerDelay(flow?.draftId);
  const category = useCategoryCreation({ getIdleFlow, runDelayed: delay.run });
  const getFreeFlow = () => (category.isOpen() ? null : getIdleFlow());

  // Header Back, Android Back and the swipe all ask the flow, after the category sheet over the form; the route goes
  // only once the flow has let the form go.
  usePreventRemove(!!flow, () => {
    if (category.isOpen()) category.close();
    else back();
  });

  // After the guard above has let go: a flow that ended or left the form takes this route with it, and a wallet
  // screen it opened, also when that was not the user's doing (a space switch, lost access). Whatever else is on
  // the stack stays, in focus if it was.
  useEffect(() => {
    if (flow) return;

    navigation
      .getState()
      .routes.filter(
        ({ key, params }) => key === route.key || (params as { forEditor?: string })?.forEditor === route.key,
      )
      .reverse()
      .forEach(({ key }) => removeRoute(navigation, key));
  }, [flow, navigation, route.key]);

  // The draft waits in the flow while a wallet is created, and comes back with it.
  const createWallet = () => {
    const current = getFreeFlow();
    if (!current) return;

    delay.cancel();
    dispatch(awayStarted({ draftId: current.draftId, target: 'wallet' }));
    navigation.navigate(ScreenNames.ADD_WALLET_SCREEN, { id: 'new', forDraft: current.draftId, forEditor: route.key });
  };

  // The full list goes with the keyboard closed, so the form comes back without it.
  const openCategories = () => {
    if (!getFreeFlow()) return;

    delay.cancel();
    Keyboard.dismiss();
    navigation.navigate(ScreenNames.TRANSACTION_CATEGORIES_SCREEN, { spaceId });
  };

  // Opens for the draft it was asked on, if the form is still the one in front once the keyboard has gone.
  const openDate = () => {
    const draftId = getFreeFlow()?.draftId;
    if (draftId === undefined) return;

    delay.run(() => {
      if (getFreeFlow()?.draftId === draftId) dispatch(dateTimeOpened());
    });
  };

  // A swipe or the backdrop is a Cancel: the draft keeps its date.
  const handleDateDismiss = () => {
    if (settleDateDismiss() && getOwnFlow()?.view.name === 'dateTime') dispatch(panelClosed());
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
            onCreateWallet={createWallet}
            onCreateCategory={category.open}
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

      <CategoryCreationSheet creation={category} />

      <ConfirmationSheet confirmation={confirmation} />
    </ScreenFrame>
  );
};

export default TransactionEditorScreen;
