import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@components/Icon/Icon';
import theme, { colors } from '@shared/theme';

import styles from './style';

const SAVE_READY_TEXT_COLOR = '#FFFDFA';

interface Props {
  helperText?: string;
  ready: boolean;
  isSubmitDisabled: boolean;
  isIncome: boolean;
  onPress: () => void;
}

const ActionRow = ({ helperText, ready, isSubmitDisabled, isIncome, onPress }: Props) => {
  const insets = useSafeAreaInsets();
  const typeColor = isIncome ? colors.ok : colors.danger;

  return (
    <View style={[styles.footer, { marginBottom: theme.spacing.xl + insets.bottom }]}>
      {helperText && (
        <View style={styles.helperRow}>
          <Icon name="info" size={13} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.helperText}>{helperText}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.saveButton,
          ready && styles.saveButtonReady,
          ready && { backgroundColor: typeColor, shadowColor: typeColor },
        ]}
        onPress={onPress}
        disabled={!ready || isSubmitDisabled}
        activeOpacity={0.8}
      >
        {ready && <Icon name="check" size={17} color={SAVE_READY_TEXT_COLOR} strokeWidth={2.4} />}

        <Text style={[styles.saveButtonText, ready && { color: SAVE_READY_TEXT_COLOR }]}>
          {ready ? (isIncome ? 'Save income' : 'Save expense') : 'Save'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ActionRow;
