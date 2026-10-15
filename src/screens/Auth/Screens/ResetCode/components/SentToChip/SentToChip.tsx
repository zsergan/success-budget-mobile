import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  email: string;
  onChange: () => void;
  disabled?: boolean;
}

const SentToChip = ({ email, onChange, disabled }: Props) => (
  <View style={styles.root}>
    <Icon name="mail" size={16} color={colors.muted} strokeWidth={1.9} />

    <Text style={styles.email}>{email}</Text>

    <TouchableOpacity
      style={styles.change}
      onPress={onChange}
      disabled={disabled}
      hitSlop={9}
      accessibilityRole="button"
      accessibilityLabel="Change email"
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={[styles.changeText, disabled && styles.changeTextDisabled]}>Change</Text>
    </TouchableOpacity>
  </View>
);

export default SentToChip;
