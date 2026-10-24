import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

interface Props {
  // The object's own tile, e.g. a CategoryIconBox.
  icon: ReactNode;
  name: string;
  meta: string;
}

// The object a confirmation is about, for its `context` slot: its tile, name and one line of facts.
const ConfirmationObject = ({ icon, name, meta }: Props) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      {icon}

      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
    </View>
  );
};

export default ConfirmationObject;
