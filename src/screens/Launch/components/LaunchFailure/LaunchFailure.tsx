import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';

import { Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import type { LaunchFailure as Failure } from '@redux/state/launch/initialState';
import { TEXT_SCALE_LIMIT } from '@screens/Launch/style';

import createStyles from './style';

interface Props {
  failure: Failure;
  retryAt: number | null;
  onRetry: () => void;
}

// Each failure names what to do next; only `offline` is about the user's connection.
const FAILURE_COPY: Record<Failure, { title: string; text: string }> = {
  resources: {
    title: 'Couldn’t start the app',
    text: 'Some of the app’s own files didn’t load. Try again; if it keeps happening, reinstall the app.',
  },
  storage: {
    title: 'Couldn’t restore your session',
    text: 'This device didn’t give back your saved sign-in. Nothing was deleted; try again.',
  },
  offline: {
    title: 'No internet connection',
    text: 'Connect to the internet and try again. You stay signed in.',
  },
  unreachable: {
    title: 'Couldn’t reach the server',
    text: 'The server didn’t answer. Check your connection and try again.',
  },
  server: {
    title: 'The server is having trouble',
    text: 'It’s on our side, not your connection. Try again in a moment.',
  },
  rateLimited: {
    title: 'Too many attempts',
    text: 'The server asked for a short pause before the next one.',
  },
};

// Seconds left before a 429's pause is over, ticking down while it lasts.
const useSecondsUntil = (until: number | null) => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (until === null) return;

    const interval = setInterval(() => setNow(Date.now()), 250);

    return () => clearInterval(interval);
  }, [until]);

  return until === null ? 0 : Math.max(0, Math.ceil((until - now) / 1000));
};

const LaunchFailure = ({ failure, retryAt, onRetry }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const waitSeconds = useSecondsUntil(retryAt);
  const isWaiting = waitSeconds > 0;
  const { title, text } = FAILURE_COPY[failure];

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${title}. ${text}`);
  }, [title, text]);

  return (
    <View style={styles.root}>
      <Text accessibilityRole="header" maxFontSizeMultiplier={TEXT_SCALE_LIMIT} style={styles.title}>
        {title}
      </Text>
      <Text maxFontSizeMultiplier={TEXT_SCALE_LIMIT} style={styles.text}>
        {text}
      </Text>

      <Pressable
        accessibilityRole="button"
        // A steady label: the countdown is in the hint, read on focus rather than every second.
        accessibilityLabel="Try again"
        accessibilityHint={isWaiting ? `Available in ${waitSeconds} seconds` : undefined}
        accessibilityState={{ disabled: isWaiting }}
        disabled={isWaiting}
        onPress={onRetry}
        style={({ pressed }) => [styles.button, (pressed || isWaiting) && styles.buttonDimmed]}
      >
        <Icon name="refresh" size={15} color={colors.text} strokeWidth={2.1} />
        <Text maxFontSizeMultiplier={TEXT_SCALE_LIMIT} style={styles.buttonLabel}>
          {isWaiting ? `Try again in ${waitSeconds} s` : 'Try again'}
        </Text>
      </Pressable>
    </View>
  );
};

export default LaunchFailure;
