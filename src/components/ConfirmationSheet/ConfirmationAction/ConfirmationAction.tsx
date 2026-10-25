import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

export type ConfirmationTone = 'neutral' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  // The primary action is filled; the others are outlined, a destructive one in its colour.
  isFilled?: boolean;
  tone?: ConfirmationTone;
  // A spinner joins the label, which then says what is running; the width stays.
  isBusy?: boolean;
  disabled?: boolean;
}

const ConfirmationAction = ({
  label,
  onPress,
  isFilled = false,
  tone = 'neutral',
  isBusy = false,
  disabled,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const isDanger = tone === 'danger';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isBusy}
      activeOpacity={0.8}
      style={[styles.action, isFilled ? styles[tone] : styles.outline, disabled && !isBusy && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || isBusy, busy: isBusy }}
    >
      {isBusy && <ActivityIndicator size="small" color={isDanger ? colors.onDestructive : colors.onNeutral} />}
      <Text
        style={[
          styles.label,
          isFilled ? styles[`${tone}Label`] : isDanger ? styles.outlineDangerLabel : styles.outlineLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default ConfirmationAction;
