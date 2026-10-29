import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import type { ThemeColors } from '@shared/theme';

import type { ToastContent, ToastTone } from './message';
import createStyles, {
  TOAST_BORDER,
  TOAST_GAP,
  TOAST_MARK_SIZE,
  TOAST_MESSAGE_MIN_WIDTH,
  TOAST_PADDING_AROUND_ACTIONS,
  TOAST_PADDING_START,
} from './style';

const CIRCLE = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z';
const TRIANGLE =
  'M12 2.6c.6 0 1.1.3 1.4.8l8.4 15.1c.6 1.1-.2 2.5-1.4 2.5H3.6c-1.2 0-2-1.4-1.4-2.5l8.4-15.1c.3-.5.8-.8 1.4-.8z';

const MARKS: Record<ToastTone, { shape: string; sign: string }> = {
  success: { shape: CIRCLE, sign: 'M7.6 12.4l3 3 5.8-6.2' },
  error: { shape: CIRCLE, sign: 'M12 7.2v5.6M12 16.6v.01' },
  info: { shape: CIRCLE, sign: 'M12 11v5.6M12 7.6v.01' },
  warning: { shape: TRIANGLE, sign: 'M12 9v4.4M12 16.9v.01' },
};

const markColor = (tone: ToastTone, colors: ThemeColors) =>
  ({ success: colors.toastOk, error: colors.destructive, info: colors.text, warning: colors.toastWarn })[tone];

const ToastMark = ({ tone }: { tone: ToastTone }) => {
  const { colors } = useTheme().colorTheme;
  const { shape, sign } = MARKS[tone];

  return (
    <Svg width={TOAST_MARK_SIZE} height={TOAST_MARK_SIZE} viewBox="0 0 24 24" testID={`toast-mark-${tone}`}>
      <Path d={shape} fill={markColor(tone, colors)} />
      <Path
        d={sign}
        fill="none"
        stroke={colors.onToastMark}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

interface Props {
  content: ToastContent;
  // The close control, which only an error has.
  onClose: () => void;
}

// The message wraps freely; its controls move under it once it would take three lines beside them, or has too
// little room there.
const Toast = ({ content: { tone, text, action }, onClose }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const canClose = tone === 'error';
  const hasControls = !!action || canClose;

  const [surfaceWidth, setSurfaceWidth] = useState<number>();
  const [controlsWidth, setControlsWidth] = useState<number>();
  const [sideBySideLines, setSideBySideLines] = useState<number>();

  const sideBySideWidth =
    surfaceWidth !== undefined && controlsWidth !== undefined
      ? surfaceWidth -
        2 * TOAST_BORDER -
        TOAST_PADDING_START -
        TOAST_MARK_SIZE -
        2 * TOAST_GAP -
        controlsWidth -
        TOAST_PADDING_AROUND_ACTIONS
      : undefined;
  const isStacked =
    hasControls &&
    sideBySideWidth !== undefined &&
    (sideBySideWidth < TOAST_MESSAGE_MIN_WIDTH || (sideBySideLines ?? 0) >= 3);

  const controls = hasControls && (
    <View
      testID="toast-controls"
      style={[styles.actions, isStacked && styles.actionsStacked]}
      onLayout={(event) => setControlsWidth(event.nativeEvent.layout.width)}
    >
      {action && (
        <>
          {/* Kept, unseen, when stacked, so the controls measure the same either way. */}
          <View style={[styles.divider, isStacked && styles.dividerHidden]} />
          <TouchableOpacity
            style={styles.action}
            onPress={action.onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        </>
      )}

      {canClose && (
        <TouchableOpacity
          style={styles.close}
          onPress={onClose}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Icon name="close" size={15} color={colors.muted} strokeWidth={2.2} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View
      testID="toast"
      style={[
        styles.surface,
        hasControls ? styles.surfaceWithActions : styles.surfacePlain,
        isStacked && styles.surfaceStacked,
      ]}
      onLayout={(event) => setSurfaceWidth(event.nativeEvent.layout.width)}
    >
      <View style={styles.row}>
        <ToastMark tone={tone} />
        <Text style={styles.message}>{text}</Text>
        {!isStacked && controls}
      </View>

      {isStacked && controls}

      {/* The message laid out beside the controls, to count its lines there whichever layout is shown. */}
      {sideBySideWidth !== undefined && sideBySideWidth > 0 && (
        <Text
          testID="toast-measure"
          style={[styles.message, styles.measure, { width: sideBySideWidth }]}
          onTextLayout={(event) => setSideBySideLines(event.nativeEvent.lines.length)}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {text}
        </Text>
      )}
    </View>
  );
};

export default Toast;
