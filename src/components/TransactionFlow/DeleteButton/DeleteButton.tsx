import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

interface Props {
  isDeleting: boolean;
  disabled: boolean;
  // The form's own button, at the end of its fields: outlined, with the bin.
  isOutlined?: boolean;
  onPress: () => void;
}

const DeleteButton = ({ isDeleting, disabled, isOutlined, onPress }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <TouchableOpacity
      style={[styles.button, isOutlined && styles.outlined, disabled && !isDeleting && styles.buttonLocked]}
      onPress={onPress}
      disabled={disabled || isDeleting}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isDeleting, busy: isDeleting }}
    >
      {isDeleting ? (
        <ActivityIndicator size="small" color={colors.danger} />
      ) : (
        isOutlined && <Icon name="trash" size={16} color={colors.danger} strokeWidth={1.8} />
      )}
      <Text style={styles.text}>{isDeleting ? 'Deleting…' : 'Delete transaction'}</Text>
    </TouchableOpacity>
  );
};

export default DeleteButton;
