import { Text, View } from 'react-native';

import { formatDateMM, getDaysLeftInMonth } from '@shared/utils';

import styles from './style';

const LimitsHeader = () => (
  <View style={styles.header}>
    <Text style={styles.title}>Limits</Text>

    <View style={styles.periodPill}>
      <Text style={styles.periodMonth}>{formatDateMM(new Date())}</Text>

      <View style={styles.periodDivider} />

      <Text style={styles.periodDays}>{`${getDaysLeftInMonth()} days left`}</Text>
    </View>
  </View>
);

export default LimitsHeader;
