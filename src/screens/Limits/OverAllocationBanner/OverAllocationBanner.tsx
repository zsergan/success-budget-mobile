import { Text, TouchableOpacity, View } from 'react-native';

import type { OverAllocationModel } from '@api/models';
import { Icon } from '@components';
import { colors } from '@shared/theme';
import { formatCurrencyAmount } from '@shared/utils';

import styles from './style';

interface Props {
  overAllocation: OverAllocationModel;
  currencyCode?: string;
  onRaiseTotal: () => void;
}

const OverAllocationBanner = ({ overAllocation, currencyCode, onRaiseTotal }: Props) => (
  <View style={styles.root}>
    <View style={styles.iconBox}>
      <Icon name="info" size={17} color={colors.warn} strokeWidth={1.9} />
    </View>

    <View style={styles.content}>
      <Text style={styles.text}>
        {`Your category limits add up to ${formatCurrencyAmount(overAllocation.categoryTotal, currencyCode)} — that's ${formatCurrencyAmount(overAllocation.difference, currencyCode)} more than the monthly total. Both keep counting, they just won't agree.`}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.raiseButton} onPress={onRaiseTotal} activeOpacity={0.7}>
          <Text style={styles.raiseButtonText}>Raise monthly total</Text>
        </TouchableOpacity>

        <View style={styles.keepButton}>
          <Text style={styles.keepButtonText}>Keep as is</Text>
        </View>
      </View>
    </View>
  </View>
);

export default OverAllocationBanner;
