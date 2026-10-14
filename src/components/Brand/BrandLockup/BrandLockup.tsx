import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import BrandMark from '../BrandMark/BrandMark';
import { STACKED_MARK_HEIGHT } from '../launchLayout';

import styles from './style';

interface Props {
  layout: 'inline' | 'stacked';
  // Lets the name and tagline appear after the mark, which is already on screen (Android's launch icon).
  fadeInText?: boolean;
}

const APP_NAME = 'Success Budget';

const TEXT_FADE_MS = 240;

const BrandLockup = ({ layout, fadeInText = false }: Props) => {
  if (layout === 'inline') {
    return (
      <View style={styles.inline}>
        <BrandMark height={30} />
        <Text style={styles.inlineName}>{APP_NAME}</Text>
      </View>
    );
  }

  const entering = fadeInText ? FadeIn.duration(TEXT_FADE_MS) : undefined;

  return (
    <View style={styles.stacked}>
      <BrandMark height={STACKED_MARK_HEIGHT} />
      <Animated.Text entering={entering} style={styles.stackedName}>
        {APP_NAME}
      </Animated.Text>
      <Animated.Text entering={entering} style={styles.tagline}>
        Personal and shared budgets
      </Animated.Text>
    </View>
  );
};

export default BrandLockup;
