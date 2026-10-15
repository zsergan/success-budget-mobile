import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';
import { hexToRgba } from '@shared/utils';

import styles from './style';

type Tone = 'warn' | 'danger' | 'success';

interface Props {
  tone: Tone;
  title?: string;
  text: string;
  // Left out when the next step is in the form itself.
  actionLabel?: string;
  // Drawn before the action's label; left out, the label stands alone.
  actionIcon?: IconType;
  isBusy?: boolean;
  onAction?: () => void;
  // 'card' is the bordered block that leads a form, with its action under the text.
  variant?: 'inline' | 'card';
  icon?: IconType;
}

const CARD_TONES = {
  danger: {
    background: colors.dangerSoft,
    border: colors.dangerBorder,
    accent: colors.danger,
    text: colors.dangerText,
  },
  warn: { background: colors.warnSoft, border: colors.warnBorder, accent: colors.warnText, text: colors.warnText },
  success: { background: colors.okSoft, border: colors.okBorder, accent: colors.okText, text: colors.okText },
};

const INLINE_COLORS: Record<Tone, string> = { warn: colors.warn, danger: colors.danger, success: colors.ok };

const DEFAULT_ICONS: Record<Tone, IconType> = { warn: 'alert', danger: 'alert', success: 'check' };

const CardBanner = ({
  tone,
  title,
  text,
  actionLabel,
  actionIcon,
  isBusy = false,
  onAction,
  icon = DEFAULT_ICONS[tone],
}: Props) => {
  const palette = CARD_TONES[tone];

  return (
    <View
      style={[styles.card, { backgroundColor: palette.background, borderColor: palette.border }]}
      accessibilityRole="alert"
    >
      <View style={styles.cardIcon}>
        <Icon name={icon} size={19} color={palette.accent} strokeWidth={2} />
      </View>

      <View style={styles.cardTextColumn}>
        {title && <Text style={[styles.cardTitle, { color: palette.accent }]}>{title}</Text>}
        <Text style={[styles.cardText, { color: palette.text }]}>{text}</Text>

        {actionLabel && onAction && (
          <TouchableOpacity
            style={[styles.cardAction, { borderColor: palette.border }]}
            onPress={onAction}
            disabled={isBusy}
            activeOpacity={0.7}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            accessibilityState={{ busy: isBusy }}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                {actionIcon && <Icon name={actionIcon} size={13} color={colors.text} strokeWidth={2.1} />}
                <Text style={styles.cardActionText}>{actionLabel}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// An inline message with the one step that resolves it, when there is one.
const Banner = (props: Props) => {
  const {
    tone,
    title,
    text,
    actionLabel,
    actionIcon,
    isBusy = false,
    onAction,
    variant = 'inline',
    icon = DEFAULT_ICONS[tone],
  } = props;

  if (variant === 'card') {
    return <CardBanner {...props} />;
  }

  const color = INLINE_COLORS[tone];

  return (
    <View style={[styles.root, { backgroundColor: hexToRgba(color, 0.12) }]} accessibilityRole="alert">
      <Icon name={icon} size={16} color={color} strokeWidth={2} />

      <View style={styles.textColumn}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.text}>{text}</Text>
      </View>

      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.action}
          onPress={onAction}
          disabled={isBusy}
          activeOpacity={0.7}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ busy: isBusy }}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <>
              {actionIcon && <Icon name={actionIcon} size={14} color={colors.text} strokeWidth={2.1} />}
              <Text style={styles.actionText}>{actionLabel}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Banner;
