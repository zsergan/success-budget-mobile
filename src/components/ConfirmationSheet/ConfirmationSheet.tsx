import { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import useBackPress from '@hooks/useBackPress';
import useSheetPresence from '@hooks/useSheetPresence';
import type {
  ConfirmationActionSpec,
  ConfirmationContentProps,
  ConfirmationPrimarySpec,
  ConfirmationTone,
} from './ConfirmationContent/ConfirmationContent';
import ConfirmationContent from './ConfirmationContent/ConfirmationContent';

export type { ConfirmationActionSpec, ConfirmationPrimarySpec, ConfirmationTone };

export interface Confirmation extends Omit<
  ConfirmationContentProps,
  'secondaryAction' | 'onAction' | 'isRunning' | 'canDismiss'
> {
  // Cancel by default; null for a message with nothing to decide, whose primary action closes it.
  secondaryAction?: ConfirmationActionSpec | null;
  // Cancel, a swipe and the backdrop; Android Back takes the secondary action, or this without one.
  onCancel: () => void;
  // Whether the user may close it meanwhile; by default not while pending. Its owner hiding it always closes it.
  isDismissible?: boolean;
}

interface Props {
  // Null hides it.
  confirmation: Confirmation | null;
}

interface RunningAction {
  opening: number;
}

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown> | null)?.then === 'function';

// An app confirmation or message in a bottom sheet sized to its content. It stacks above an open sheet, keeps what it
// showed while it animates away, and decides nothing itself: every choice goes back to its owner.
const ConfirmationSheet = ({ confirmation }: Props) => {
  const isVisible = confirmation !== null;
  const [shown, setShown] = useState(confirmation);
  if (confirmation && confirmation !== shown) setShown(confirmation);
  // Each opening shows fresh content, which starts with screen reader focus on its title.
  const [wasVisible, setWasVisible] = useState(false);
  const [opening, setOpening] = useState(0);
  if (isVisible !== wasVisible) {
    setWasVisible(isVisible);
    if (isVisible) setOpening(opening + 1);
  }
  const current = confirmation ?? shown;

  const { ref, settleDismiss } = useSheetPresence(isVisible);
  // The running action and its opening: the ref stops a second press in the same frame, the state disables the actions
  // once it renders. An action an earlier opening left running neither locks a later one nor, settling, unlocks it.
  const runningRef = useRef<RunningAction | null>(null);
  const [running, setRunning] = useState<RunningAction | null>(null);
  const isRunning = running?.opening === opening;
  const isPending = current?.isPending ?? false;
  const canDismiss = !isRunning && (current?.isDismissible ?? !isPending);
  const secondaryAction = !current
    ? null
    : current.secondaryAction === undefined
      ? { label: 'Cancel', onPress: current.onCancel }
      : current.secondaryAction;

  const run = (onPress: () => unknown) => {
    if (!isVisible || runningRef.current?.opening === opening) return;

    const result = onPress();
    if (!isThenable(result)) return;

    const action = { opening };
    runningRef.current = action;
    setRunning(action);
    const release = () => {
      if (runningRef.current !== action) return;
      runningRef.current = null;
      setRunning(null);
    };
    result.then(release, release);
  };

  const cancel = () => {
    if (canDismiss && current) run(current.onCancel);
  };

  useBackPress(isVisible, () => {
    if (canDismiss && current) run(secondaryAction?.onPress ?? current.onCancel);
  });

  // A swipe closes the sheet itself; one hidden by its owner is not a cancel.
  const handleDismiss = () => {
    if (settleDismiss()) current?.onCancel();
  };

  // Nothing typed below stays in front of the question.
  useEffect(() => {
    if (isVisible) Keyboard.dismiss();
  }, [isVisible]);

  return (
    <BottomModal
      ref={ref}
      fitContent
      stackBehavior="push"
      isDismissible={canDismiss}
      onBackdropPress={cancel}
      onDismiss={handleDismiss}
    >
      {current && (
        <ConfirmationContent
          key={opening}
          {...current}
          secondaryAction={secondaryAction}
          onAction={run}
          isRunning={isRunning}
          canDismiss={canDismiss}
        />
      )}
    </BottomModal>
  );
};

export default ConfirmationSheet;
