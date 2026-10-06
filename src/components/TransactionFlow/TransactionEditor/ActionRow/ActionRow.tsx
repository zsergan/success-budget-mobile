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
  typeColor: string;
  onPress: () => void;
}

const ActionRow = ({ label, helperText, ready, isSaving, typeColor, onPress }: Props) => {
  const insets = useSafeAreaInsets();
  const isActive = ready || isSaving;

  return (
    <View style={[styles.footer, { marginBottom: theme.spacing.xl + insets.bottom }]}>
      {helperText && !isSaving && (
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
    </View>
  );
};

export default ActionRow;
