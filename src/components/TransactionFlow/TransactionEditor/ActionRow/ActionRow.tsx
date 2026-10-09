import type { ReactNode } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@components/Icon/Icon';
import theme, { colors } from '@shared/theme';

import styles from './style';

const SAVE_READY_TEXT_COLOR = '#FFFDFA';

interface Props {
  label: string;
  helperText?: string;
  ready: boolean;
  isSaving: boolean;
  // The home indicator is under the keyboard then, so its inset is not kept.
  isAboveKeyboard?: boolean;
  typeColor: string;
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
  banner,
  footer,
  onPress,
}: Props) => {
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
          <ActivityIndicator size="small" color={SAVE_READY_TEXT_COLOR} />
        ) : (
          ready && <Icon name="check" size={17} color={SAVE_READY_TEXT_COLOR} strokeWidth={2.4} />
        )}

        <Text style={[styles.saveButtonText, isActive && { color: SAVE_READY_TEXT_COLOR }]}>
          {isSaving ? 'Saving…' : label}
        </Text>
      </TouchableOpacity>

      {footer}
    </View>
  );
};

export default ActionRow;
