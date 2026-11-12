import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  onBack: () => void;
}

// Stays above the list, so the way back is there however far the list is scrolled.
const StatsTransactionsHeader = ({ onBack }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.bar}>
      <TouchableOpacity
        style={styles.back}
        onPress={onBack}
        activeOpacity={0.6}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Back to Stats"
      >
        <Icon name="back" size={17} color={colors.text} strokeWidth={2.2} />
        <Text style={styles.backLabel}>Stats</Text>
      </TouchableOpacity>
    </View>
  );
};

export const StatsTransactionsTitle = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <Text style={styles.title} accessibilityRole="header">
      Transactions
    </Text>
  );
};

export default StatsTransactionsHeader;
