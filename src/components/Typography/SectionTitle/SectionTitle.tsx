import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';

import TinyButton from '@components/Buttons/TinyButton/TinyButton';
import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

interface Props {
  title: string;
  button?: ReactNode;
  onBackButtonPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const SectionTitle = ({ title, button, onBackButtonPress, style }: Props) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.root, style]}>
      <View style={styles.titleContainer}>
        {onBackButtonPress && (
          <TinyButton icon="back" size="lg" iconWrap={false} strokeWidth={2} onPress={onBackButtonPress} />
        )}

        {title && <Text style={[styles.title, onBackButtonPress && styles.headerTitle]}>{title}</Text>}
      </View>

      {button}
    </View>
  );
};

export default SectionTitle;
