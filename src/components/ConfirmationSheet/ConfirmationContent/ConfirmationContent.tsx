import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { AccessibilityInfo, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import Icon from '@components/Icon/Icon';
import useKeyboardHeight from '@hooks/useKeyboardHeight';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import type { ThemeColors } from '@shared/theme';
import type { ConfirmationTone } from '../ConfirmationAction/ConfirmationAction';
import ConfirmationAction from '../ConfirmationAction/ConfirmationAction';

import createStyles from './style';

export type { ConfirmationTone };

export interface ConfirmationActionSpec {
  label: string;
  // A returned promise keeps every action from running again until it settles.
  onPress: () => unknown;
  tone?: ConfirmationTone;
  // Shown but not available, e.g. a step that cannot be taken yet.
  isDisabled?: boolean;
}

export interface ConfirmationPrimarySpec extends ConfirmationActionSpec {
  // What the primary action says while `isPending`, e.g. "Deleting…".
  busyLabel?: string;
}

type MessageTone = 'danger' | 'warn';

export interface ConfirmationContentProps {
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
  // Null for a message with nothing to decide, whose primary action closes it.
  secondaryAction: ConfirmationActionSpec | null;
  // A third choice between the two, outlined.
  additionalAction?: ConfirmationActionSpec;
  // The primary action's request runs: it shows that, and nothing else can be pressed.
  isPending?: boolean;
  // Over the actions; the primary action retries.
  message?: { text: string; tone?: MessageTone };
  // Under the actions, e.g. that closing does not stop a long wait.
  note?: string;
  // Every press goes through it, so its owner can hold the actions while one runs.
  onAction?: (onPress: () => unknown) => void;
  isRunning?: boolean;
  // Whether the secondary action may be taken now.
  canDismiss?: boolean;
}

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

const runAction = (onPress: () => unknown) => void onPress();

// What a confirmation or a message shows, for a sheet sized to its content: its own, or one whose view it becomes.
const ConfirmationContent = ({
  title,
  description,
  step,
  context,
  consequences,
  children,
  primaryAction,
  secondaryAction,
  additionalAction,
  isPending = false,
  message,
  note,
  onAction = runAction,
  isRunning = false,
  canDismiss = !isRunning && !isPending,
}: ConfirmationContentProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme().colorTheme;
  const { bottom } = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  // Screen reader focus starts on the title each time the content appears.
  const titleRef = useRef<Text>(null);
  const focusesTitleRef = useRef(true);
  const handleTitleLayout = () => {
    if (!focusesTitleRef.current || !titleRef.current) return;

    focusesTitleRef.current = false;
    AccessibilityInfo.sendAccessibilityEvent(titleRef.current, 'focus');
  };

  const messageText = message?.text;
  useEffect(() => {
    if (messageText) AccessibilityInfo.announceForAccessibility(messageText);
  }, [messageText]);

  const [bodyHeight, setBodyHeight] = useState(0);
  const [bodyContentHeight, setBodyContentHeight] = useState(0);
  const isScrollable = bodyContentHeight > bodyHeight + 1;

  const messageStyle = message && messageAppearance(message.tone ?? 'danger', colors);
  const consequencesStyle = consequences && consequencesAppearance(consequences.tone, colors);

  return (
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
          disabled={isRunning || primaryAction.isDisabled}
          onPress={() => onAction(primaryAction.onPress)}
        />

        {additionalAction && (
          <ConfirmationAction
            label={additionalAction.label}
            tone={additionalAction.tone}
            disabled={isRunning || isPending || additionalAction.isDisabled}
            onPress={() => onAction(additionalAction.onPress)}
          />
        )}

        {secondaryAction && (
          <ConfirmationAction
            label={secondaryAction.label}
            tone={secondaryAction.tone}
            disabled={!canDismiss || secondaryAction.isDisabled}
            onPress={() => onAction(secondaryAction.onPress)}
          />
        )}

        {note && <Text style={styles.note}>{note}</Text>}
      </View>
    </View>
  );
};

export default ConfirmationContent;
