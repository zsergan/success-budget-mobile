import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import styles from './style';

interface Props {
  title: string;
  button?: ReactNode;
}

const SectionTitle = ({ title, button }: Props) => {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>

      {button}
    </View>
  );
};

export default SectionTitle;
