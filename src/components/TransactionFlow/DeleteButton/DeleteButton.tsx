import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  isDeleting: boolean;
  disabled: boolean;
  onPress: () => void;
}

const DeleteButton = ({ isDeleting, disabled, onPress }: Props) => (
  <TouchableOpacity
    style={[styles.button, disabled && !isDeleting && styles.buttonLocked]}
    onPress={onPress}
    disabled={disabled || isDeleting}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityState={{ disabled: disabled || isDeleting, busy: isDeleting }}
  >
    {isDeleting && <ActivityIndicator size="small" color={colors.danger} />}
    <Text style={styles.text}>{isDeleting ? 'Deleting…' : 'Delete transaction'}</Text>
  </TouchableOpacity>
);

export default DeleteButton;
