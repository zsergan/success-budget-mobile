import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLockup, Button, Icon, PendingInvitationNotice } from '@components';
import { useLayout, useTheme, useThemedStyles } from '@hooks';
import { ScreenNames } from '@shared/enums';
import type { IconType, RootStackScreenProps } from '@shared/types';

import createStyles, { screenGaps } from './style';

interface Props extends RootStackScreenProps<ScreenNames.WELCOME_SCREEN> {}

const FEATURE_POINTS: { icon: IconType; label: string }[] = [
  { icon: 'plus', label: 'Start right away: no wallets or accounts to set up' },
  { icon: 'users', label: 'Share a space and see who each transaction is for' },
  { icon: 'limit', label: 'Monthly limits for the whole space or a category' },
];

// Already display-sized: grown further, single words no longer fit the width and break mid-word.
const HEADLINE_SCALE_LIMIT = 1.25;

const WelcomeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const gaps = screenGaps(useLayout());

  return (
    <View style={styles.root}>
      {/* On a short screen or with large text the content scrolls, so both buttons stay reachable. */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + gaps.top, paddingBottom: Math.max(gaps.bottom, insets.bottom) },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <BrandLockup layout="inline" />

        <View style={styles.body}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={HEADLINE_SCALE_LIMIT} style={styles.headline}>
            See where the money goes
          </Text>

          <Text style={styles.description}>
            Record income and expenses in seconds and see where each month went. One currency per space, and no setup
            before your first entry.
          </Text>

          <View style={styles.points}>
            {FEATURE_POINTS.map((point) => (
              <View key={point.label} style={styles.point}>
                <View style={styles.pointIconBox}>
                  <Icon name={point.icon} size={13} color={colors.text} strokeWidth={2.2} />
                </View>

                <Text style={styles.pointLabel}>{point.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <PendingInvitationNotice />

          <Button
            title="Sign In"
            size="lg"
            withShadow
            onPress={() => navigation.navigate(ScreenNames.SIGN_IN_SCREEN)}
          />

          <Button
            title="Create account"
            variant="outline"
            size="lg"
            onPress={() => navigation.navigate(ScreenNames.SIGN_UP_SCREEN)}
          />

          <Text style={styles.footerNote}>Your data stays in your account only</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default WelcomeScreen;
