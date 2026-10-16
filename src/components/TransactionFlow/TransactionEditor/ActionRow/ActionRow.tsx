import type { ReactNode } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import theme from '@shared/theme';

import createStyles from './style';

interface Props {
  label: string;
  helperText?: string;
  ready: boolean;
  isSaving: boolean;
  // The home indicator is under the keyboard then, so its inset is not kept.
  isAboveKeyboard?: boolean;
  typeColor: string;
  // Text and icons drawn on typeColor.
  onTypeColor: string;
  // Shown over Save in place of the helper text.
  banner?: ReactNode;
  // Under Save, e.g. Delete in an edit.
  footer?: ReactNode;
  onPress: () => void;
}

const ActionRow = ({
  label,
  helperText,
  ready,
  isSaving,
  isAboveKeyboard = false,
  typeColor,
  onTypeColor,
  banner,
  footer,
  onPress,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isActive = ready || isSaving;

  return (
    <View
      style={[styles.footer, { marginBottom: isAboveKeyboard ? theme.spacing.md : theme.spacing.md + insets.bottom }]}
    >
      {banner}

      {!banner && helperText && !isSaving && (
        <View style={styles.helperRow}>
          <Icon name="info" size={13} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.helperText}>{helperText}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.saveButton,
          isActive && styles.saveButtonReady,
          isActive && { backgroundColor: typeColor, shadowColor: typeColor },
        ]}
        onPress={onPress}
        disabled={!ready || isSaving}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ disabled: !ready || isSaving, busy: isSaving }}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={onTypeColor} />
        ) : (
          ready && <Icon name="check" size={17} color={onTypeColor} strokeWidth={2.4} />
        )}

        <Text style={[styles.saveButtonText, isActive && { color: onTypeColor }]}>{isSaving ? 'Saving…' : label}</Text>
      </TouchableOpacity>

      {footer}
    </View>
  );
};

export default ActionRow;
