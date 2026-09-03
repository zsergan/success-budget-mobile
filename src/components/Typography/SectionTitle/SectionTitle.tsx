import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';

import { TinyButton } from '../../Buttons';

import styles from './style';

interface Props {
  title: string;
  button?: ReactNode;
  onBackButtonPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const SectionTitle = ({ title, button, onBackButtonPress, style }: Props) => (
  <View style={[styles.root, style]}>
    <View style={styles.titleContainer}>
      {onBackButtonPress && <TinyButton icon="back" onPress={onBackButtonPress} />}

      {title && <Text style={styles.title}>{title}</Text>}
    </View>

    {button}
  </View>
);

export default SectionTitle;
