import type { DimensionValue } from 'react-native';
import { Text, View } from 'react-native';

import styles from './style';

interface Props {
  percentage: number;
  positionInfo?: 'top' | 'bottom';
  leftInfo?: string;
  rightInfo?: string;
  /** Overrides the default 60/90% green/yellow/red thresholds with an explicit bar color. */
  color?: string;
}

const ProgressBar = ({ percentage, positionInfo, leftInfo, rightInfo, color }: Props) => {
  const progressWidth: DimensionValue = percentage > 100 ? '100%' : `${percentage}%`;
  const progressColor =
    percentage > 90 ? styles.progressRed : percentage > 60 ? styles.progressYellow : styles.progressGreen;

  return (
    <View style={[styles.root, positionInfo === 'top' && styles.rootReverse]}>
      <View style={styles.bar}>
        <View style={[styles.progress, color ? { backgroundColor: color } : progressColor, { width: progressWidth }]} />
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>{leftInfo}</Text>

        <Text style={styles.infoText}>{rightInfo}</Text>
      </View>
    </View>
  );
};

export default ProgressBar;
