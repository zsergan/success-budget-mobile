import { Text, View } from 'react-native';

import styles from './style';

const TransactionsHeader = () => (
  <View style={styles.header}>
    <Text style={styles.title}>Transactions</Text>
  </View>
);

export default TransactionsHeader;
