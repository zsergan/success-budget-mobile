import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import useThemedStyles from '@hooks/useThemedStyles';

import BrandMark from '../BrandMark/BrandMark';
import { STACKED_MARK_HEIGHT } from '../launchLayout';

import createStyles from './style';

interface Props {
  layout: 'inline' | 'stacked';
  // Lets the name and tagline appear after the mark, which is already on screen (Android's launch icon).
  fadeInText?: boolean;
}

const APP_NAME = 'Success Budget';

const TAGLINE = 'Personal and shared budgets';

const TEXT_FADE_MS = 240;

// The name is part of the logo: it keeps its size under large system text, as the system launch screen does.
const LOGO_TEXT = { maxFontSizeMultiplier: 1 } as const;

const BrandLockup = ({ layout, fadeInText = false }: Props) => {
  const styles = useThemedStyles(createStyles);

  if (layout === 'inline') {
    return (
      <View style={styles.inline} accessible accessibilityRole="header" accessibilityLabel={APP_NAME}>
        <BrandMark height={30} />
        <Text {...LOGO_TEXT} style={styles.inlineName}>
          {APP_NAME}
        </Text>
      </View>
    );
  }

  const entering = fadeInText ? FadeIn.duration(TEXT_FADE_MS) : undefined;

  return (
    <View style={styles.stacked} accessible accessibilityRole="header" accessibilityLabel={`${APP_NAME}. ${TAGLINE}`}>
      <BrandMark height={STACKED_MARK_HEIGHT} />
      <Animated.Text {...LOGO_TEXT} entering={entering} style={styles.stackedName}>
        {APP_NAME}
      </Animated.Text>
      <Animated.Text {...LOGO_TEXT} entering={entering} style={styles.tagline}>
        {TAGLINE}
      </Animated.Text>
    </View>
  );
};

export default BrandLockup;
