import { Text, View } from 'react-native';

import { useThemedStyles } from '@hooks';
import { formatDateMM, getDaysLeftInMonth } from '@shared/utils';

import createStyles from './style';

const LimitsHeader = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Limits</Text>

      <View style={styles.periodPill}>
        <Text style={styles.periodMonth}>{formatDateMM(new Date())}</Text>

        <View style={styles.periodDivider} />

        <Text style={styles.periodDays}>{`${getDaysLeftInMonth()} days left`}</Text>
      </View>
    </View>
  );
};

export default LimitsHeader;
