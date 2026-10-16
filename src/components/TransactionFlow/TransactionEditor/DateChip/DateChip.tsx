import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { formatDateTime } from '../../format';

import createStyles from './style';

interface Props {
  timestamp: string;
  error?: string;
  onPress: () => void;
}

const DateChip = ({ timestamp, error, onPress }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Date</Text>

      <TouchableOpacity style={[styles.chip, error && styles.chipError]} onPress={onPress} activeOpacity={0.6}>
        <Icon name="calendar" size={16} color={colors.muted} strokeWidth={1.8} />
        <Text style={styles.chipText}>{formatDateTime(timestamp)}</Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

export default DateChip;
