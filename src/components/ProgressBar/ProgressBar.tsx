import type { DimensionValue } from 'react-native';
import { Text, View } from 'react-native';

import styles from './style';

interface Props {
  percentage: number;
  positionInfo?: 'top' | 'bottom';
  leftInfo?: string;
  rightInfo?: string;
}

const ProgressBar = ({ percentage, positionInfo, leftInfo, rightInfo }: Props) => {
  const progressWidth: DimensionValue = percentage > 100 ? '100%' : `${percentage}%`;
  const progressColor =
    percentage > 90 ? styles.progressRed : percentage > 60 ? styles.progressYellow : styles.progressGreen;

  return (
    <View style={[styles.root, positionInfo === 'top' && styles.rootReverse]}>
      <View style={styles.bar}>
        <View style={[styles.progress, progressColor, { width: progressWidth }]} />
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>{leftInfo}</Text>

        <Text style={styles.infoText}>{rightInfo}</Text>
      </View>
    </View>
  );
};

export default ProgressBar;
