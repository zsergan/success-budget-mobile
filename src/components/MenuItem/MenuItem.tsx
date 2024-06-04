import { View, Text, TouchableOpacity } from 'react-native';

import type { IconType } from '@shared/types';
import CircleIcon from '../CircleIcon/CircleIcon';

import styles from './style';

interface Props {
  title: string;
  icon: IconType;
  onPress?(): void;
}

const MenuItem = ({ title, icon, onPress }: Props) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <View style={styles.root}>
      <View style={styles.labelContainer}>
        <CircleIcon icon={icon} size="lg" />

        <Text style={styles.label}>{title}</Text>
      </View>

      <CircleIcon icon="keyboard-arrow-right" size="lg" />
    </View>
  </TouchableOpacity>
);

export default MenuItem;
