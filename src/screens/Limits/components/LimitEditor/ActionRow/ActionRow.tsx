import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@components';
import theme, { colors } from '@shared/theme';

import styles from './style';

interface Props {
  onDeletePress?: () => void;
  canSubmit: boolean;
  saveLabel: string;
  onSubmit: () => void;
}

const ActionRow = ({ onDeletePress, canSubmit, saveLabel, onSubmit }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { marginBottom: theme.spacing.xl + insets.bottom }]}>
      <View style={styles.resetNote}>
        <Icon name="refresh" size={15} color={colors.muted} strokeWidth={1.9} />

        <Text style={styles.resetNoteText}>Resets on the 1st of every month · no rollover</Text>
      </View>

      <View style={styles.footerRow}>
        {onDeletePress && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDeletePress} activeOpacity={0.7} hitSlop={4}>
            <Icon name="trash" size={19} color={colors.danger} strokeWidth={1.8} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.saveButton, canSubmit && styles.saveButtonReady]}
          onPress={onSubmit}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          {canSubmit && <Icon name="check" size={17} color="#FFFDFA" strokeWidth={2.4} />}

          <Text style={[styles.saveButtonText, canSubmit && styles.saveButtonTextReady]}>{saveLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ActionRow;
