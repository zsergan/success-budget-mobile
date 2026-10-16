import { View, Text, TouchableOpacity } from 'react-native';

import type { IconType } from '@shared/types';
import useThemedStyles from '@hooks/useThemedStyles';
import CircleIcon from '../CircleIcon/CircleIcon';

import createStyles from './style';

interface Props {
  title: string;
  icon: IconType;
  onPress?(): void;
}

const MenuItem = ({ title, icon, onPress }: Props) => {
  const styles = useThemedStyles(createStyles);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.root}>
        <View style={styles.labelContainer}>
          <CircleIcon icon={icon} size="sm" />

          <Text style={styles.label}>{title}</Text>
        </View>

        <CircleIcon icon="forward" size="sm" />
      </View>
    </TouchableOpacity>
  );
};

export default MenuItem;
