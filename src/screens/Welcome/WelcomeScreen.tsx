import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, GradientBackground, Icon } from '@components';
import { ScreenNames } from '@shared/enums';
import type { IconType, ScreenProps } from '@shared/types';
import { colors } from '@shared/theme';

import styles from './style';

interface Props extends ScreenProps<ScreenNames.WELCOME_SCREEN> {}

const FEATURE_POINTS: { icon: IconType; label: string }[] = [
  { icon: 'wallet', label: 'Wallets and transfers between them' },
  { icon: 'limit', label: 'Limits with an alert at 80%' },
  { icon: 'list', label: 'History with filters and search' },
];

const WelcomeScreen = ({ navigation }: Props) => (
  <SafeAreaView style={styles.root}>
    <GradientBackground colors={[colors.bg, colors.track]} />

    <View style={styles.header}>
      <View style={styles.logoBox}>
        <Icon name="chart" size={20} color={colors.onAccent} strokeWidth={2.2} />
      </View>

      <Text style={styles.logoText}>Success Budget</Text>
    </View>

    <View style={styles.body}>
      <Text style={styles.headline}>See where the money goes</Text>

      <Text style={styles.description}>
        Wallets, limits and spending history in one place. One currency per budget space, picked once, and no setup
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
      <Button title="Sign In" onPress={() => navigation.navigate(ScreenNames.SIGN_IN_SCREEN)} />

      <Button
        title="Create account"
        onPress={() => navigation.navigate(ScreenNames.SIGN_UP_SCREEN)}
        variant="secondary"
      />

      <Text style={styles.footerNote}>Your data stays in your account only</Text>
    </View>
  </SafeAreaView>
);

export default WelcomeScreen;
