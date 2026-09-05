import { Text, View } from 'react-native';

import type { LimitsOverall } from '@api/dto';
import { ProgressBar } from '@components';
import { formatCurrencyAmount, formatDateMM } from '@shared/utils';

import styles from './style';

interface Props {
  overall: LimitsOverall;
  baseCurrencyCode: string;
}

const Overall = ({ overall, baseCurrencyCode }: Props) => (
  <View style={styles.root}>
    <View>
      <Text style={styles.spent}>{formatCurrencyAmount(overall.spent, baseCurrencyCode)}</Text>

      <Text style={styles.note}>Spent in {formatDateMM(new Date())}</Text>
    </View>

    <ProgressBar
      positionInfo="top"
      leftInfo={`${overall.in_percent}% Spent`}
      rightInfo={formatCurrencyAmount(overall.sum, baseCurrencyCode)}
      percentage={overall.in_percent}
    />
  </View>
);

export default Overall;
