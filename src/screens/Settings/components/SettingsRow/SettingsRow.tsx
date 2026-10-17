import { Text, TouchableOpacity, View } from 'react-native';

import { CircleIcon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import type { IconType } from '@shared/types';

import createStyles from './style';

interface Props {
  icon: IconType;
  label: string;
  sub?: string;
  value?: string;
  chevron?: boolean;
  danger?: boolean;
  /** Renders a fixed, non-interactive "off" switch instead of a chevron -- for rows with no working functionality yet. */
  inertToggle?: boolean;
  onPress?: () => void;
}

const SettingsRow = ({ icon, label, sub, value, chevron = true, danger, inertToggle, onPress }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <CircleIcon icon={icon} size="md" color={danger ? colors.danger : colors.text} circleColor={colors.track} />

      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>

        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>

      {value && <Text style={styles.rowValue}>{value}</Text>}

      {inertToggle && (
        <View style={styles.toggleTrack}>
          <View style={styles.toggleKnob} />
        </View>
      )}

      {!inertToggle && chevron && onPress && (
        <CircleIcon icon="forward" size="sm" color={danger ? colors.danger : colors.muted} />
      )}
    </TouchableOpacity>
  );
};

export default SettingsRow;
