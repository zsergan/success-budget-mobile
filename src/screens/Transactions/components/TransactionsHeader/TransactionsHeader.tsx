import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { colors } from '@shared/theme';

import styles from './style';

// The search button is intentionally inert for now — search is not built yet.
const TransactionsHeader = () => (
  <View style={styles.header}>
    <Text style={styles.title}>Transactions</Text>

    <TouchableOpacity style={styles.searchButton} hitSlop={8}>
      <Icon name="search" size={18} color={colors.text} />
    </TouchableOpacity>
  </View>
);

export default TransactionsHeader;
