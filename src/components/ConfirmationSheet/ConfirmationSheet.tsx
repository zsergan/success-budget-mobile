import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { AccessibilityInfo, Keyboard, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import Icon from '@components/Icon/Icon';
import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import useBackPress from '@hooks/useBackPress';
import useKeyboardHeight from '@hooks/useKeyboardHeight';
import useSheetPresence from '@hooks/useSheetPresence';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import type { ThemeColors } from '@shared/theme';
import type { ConfirmationTone } from './ConfirmationAction/ConfirmationAction';
import ConfirmationAction from './ConfirmationAction/ConfirmationAction';

import createStyles from './style';

export type { ConfirmationTone };

export interface ConfirmationActionSpec {
  label: string;
  // A returned promise keeps every action from running again until it settles.
  onPress: () => unknown;
  tone?: ConfirmationTone;
}

export interface ConfirmationPrimarySpec extends ConfirmationActionSpec {
  // What the primary action says while `isPending`, e.g. "Deleting…".
  busyLabel?: string;
}

type MessageTone = 'danger' | 'warn';

interface Props {
  isVisible: boolean;
  title: string;
  description: string;
  // "Step 1 of 2", over the title.
  step?: string;
  // The object the decision is about, when the title alone does not identify it; built by the caller.
  context?: ReactNode;
  // Only confirmed consequences, up to four: warn when related data changes, danger when data goes.
  consequences?: { tone: 'warn' | 'danger'; title: string; items: string[] };
  // Further content under the consequences, such as a field: a BottomSheetTextInput, so the sheet rises above the keyboard.
  children?: ReactNode;
  primaryAction: ConfirmationPrimarySpec;
  // Cancel by default; null for a message with nothing to decide, whose primary action closes it.
  secondaryAction?: ConfirmationActionSpec | null;
  // A third choice between the two, outlined.
  additionalAction?: ConfirmationActionSpec;
  // Cancel, a swipe and the backdrop; Android Back takes the secondary action, or this without one.
  onCancel: () => void;
  // The primary action's request runs: it shows that, and nothing else can be pressed.
  isPending?: boolean;
  // Whether the user may close it meanwhile; by default not while pending. Its owner hiding it always closes it.
  isDismissible?: boolean;
  // Over the actions; the primary action retries.
  message?: { text: string; tone?: MessageTone };
  // Under the actions, e.g. that closing does not stop a long wait.
  note?: string;
}

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown> | null)?.then === 'function';

const messageAppearance = (tone: MessageTone, colors: ThemeColors) =>
  ({
    danger: { background: colors.dangerSoft, icon: 'alert' as const, iconColor: colors.destructive },
    warn: { background: colors.warnSoft, icon: 'clock' as const, iconColor: colors.warnText },
  })[tone];

const consequencesAppearance = (tone: 'warn' | 'danger', colors: ThemeColors) =>
  ({
    warn: { background: colors.warnSoft, accent: colors.warnText },
    danger: { background: colors.dangerSoft, accent: colors.destructive },
  })[tone];

// An app confirmation or message in a bottom sheet sized to its content. It stacks above an open sheet, keeps what it
// showed while it animates away, and decides nothing itself: every choice goes back to its owner.
const ConfirmationSheet = (props: Props) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme().colorTheme;
  const { bottom } = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const [shown, setShown] = useState(props);
  if (props.isVisible && props !== shown) setShown(props);
  const { isVisible } = props;
  const current = isVisible ? props : shown;
  const {
    title,
    description,
    step,
    context,
    consequences,
    children,
    primaryAction,
    additionalAction,
    onCancel,
    isPending = false,
    isDismissible = !isPending,
    message,
    note,
  } = current;
  const secondaryAction =
    current.secondaryAction === undefined ? { label: 'Cancel', onPress: onCancel } : current.secondaryAction;

  const { ref, settleDismiss } = useSheetPresence(isVisible);
  // The ref stops a second press in the same frame; the state disables the actions once it renders.
  const runningRef = useRef(false);
  const [isRunning, setRunning] = useState(false);
  const canDismiss = !isRunning && isDismissible;

  const run = (onPress: () => unknown) => {
    if (!isVisible || runningRef.current) return;

    const result = onPress();
    if (!isThenable(result)) return;

    runningRef.current = true;
    setRunning(true);
    const release = () => {
      runningRef.current = false;
      setRunning(false);
    };
    result.then(release, release);
  };

  const cancel = () => {
    if (canDismiss) run(onCancel);
  };

  useBackPress(isVisible, () => {
    if (canDismiss) run(secondaryAction?.onPress ?? onCancel);
  });

  // A swipe closes the sheet itself; one hidden by its owner is not a cancel.
  const handleDismiss = () => {
    if (settleDismiss()) onCancel();
  };

  // Each opening starts with screen reader focus on the title and without the keyboard of what is below.
  const titleRef = useRef<Text>(null);
  const focusesTitleRef = useRef(false);
  useEffect(() => {
    if (!isVisible) return;

    focusesTitleRef.current = true;
    Keyboard.dismiss();
  }, [isVisible]);

  const handleTitleLayout = () => {
    if (!focusesTitleRef.current || !titleRef.current) return;

    focusesTitleRef.current = false;
    AccessibilityInfo.sendAccessibilityEvent(titleRef.current, 'focus');
  };

  const messageText = isVisible ? message?.text : undefined;
  useEffect(() => {
    if (messageText) AccessibilityInfo.announceForAccessibility(messageText);
  }, [messageText]);

  const [bodyHeight, setBodyHeight] = useState(0);
  const [bodyContentHeight, setBodyContentHeight] = useState(0);
  const isScrollable = bodyContentHeight > bodyHeight + 1;

  const messageStyle = message && messageAppearance(message.tone ?? 'danger', colors);
  const consequencesStyle = consequences && consequencesAppearance(consequences.tone, colors);

  return (
    <BottomModal
      ref={ref}
      fitContent
      stackBehavior="push"
      isDismissible={canDismiss}
      onBackdropPress={cancel}
      onDismiss={handleDismiss}
    >
      <View style={styles.sheet} accessibilityViewIsModal>
        <BottomSheetScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          onLayout={(event: LayoutChangeEvent) => setBodyHeight(event.nativeEvent.layout.height)}
          onContentSizeChange={(_width: number, height: number) => setBodyContentHeight(height)}
          keyboardShouldPersistTaps="handled"
        >
          {step && <Text style={styles.step}>{step}</Text>}

          <View style={styles.heading}>
            <Text ref={titleRef} style={styles.title} accessibilityRole="header" onLayout={handleTitleLayout}>
              {title}
            </Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          {context}

          {consequences && consequencesStyle && (
            <View style={[styles.consequences, { backgroundColor: consequencesStyle.background }]}>
              <Text style={[styles.consequencesTitle, { color: consequencesStyle.accent }]}>{consequences.title}</Text>
              {consequences.items.map((item) => (
                <View key={item} style={styles.consequence}>
                  <View style={[styles.bullet, { backgroundColor: consequencesStyle.accent }]} />
                  <Text style={styles.consequenceText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {children}
        </BottomSheetScrollView>

        <View
          style={[
            styles.footer,
            isScrollable && styles.footerDivided,
            // Above the keyboard the sheet needs no safe area; without a home indicator it keeps 16.
            { paddingBottom: keyboardHeight > 0 ? 12 : Math.max(bottom, 16) },
          ]}
        >
          {message && messageStyle && (
            <View
              style={[styles.message, { backgroundColor: messageStyle.background }]}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              <View style={styles.messageIcon}>
                <Icon name={messageStyle.icon} size={16} color={messageStyle.iconColor} strokeWidth={2.1} />
              </View>
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          )}

          <ConfirmationAction
            label={isPending ? (primaryAction.busyLabel ?? primaryAction.label) : primaryAction.label}
            tone={primaryAction.tone}
            isFilled
            isBusy={isPending}
            disabled={isRunning}
            onPress={() => run(primaryAction.onPress)}
          />

          {additionalAction && (
            <ConfirmationAction
              label={additionalAction.label}
              tone={additionalAction.tone}
              disabled={isRunning || isPending}
              onPress={() => run(additionalAction.onPress)}
            />
          )}

          {secondaryAction && (
            <ConfirmationAction
              label={secondaryAction.label}
              tone={secondaryAction.tone}
              disabled={!canDismiss}
              onPress={() => run(secondaryAction.onPress)}
            />
          )}

          {note && <Text style={styles.note}>{note}</Text>}
        </View>
      </View>
    </BottomModal>
  );
};

export default ConfirmationSheet;
