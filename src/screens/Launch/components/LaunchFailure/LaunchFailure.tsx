import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@components';
import type { LaunchFailure as Failure } from '@redux/state/launch/initialState';
import { colors } from '@shared/theme';

import styles from './style';

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
  const waitSeconds = useSecondsUntil(retryAt);
  const isWaiting = waitSeconds > 0;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{FAILURE_COPY[failure].title}</Text>
      <Text style={styles.text}>{FAILURE_COPY[failure].text}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isWaiting }}
        disabled={isWaiting}
        onPress={onRetry}
        style={({ pressed }) => [styles.button, (pressed || isWaiting) && styles.buttonDimmed]}
      >
        <Icon name="refresh" size={15} color={colors.text} strokeWidth={2.1} />
        <Text style={styles.buttonLabel}>{isWaiting ? `Try again in ${waitSeconds} s` : 'Try again'}</Text>
      </Pressable>
    </View>
  );
};

export default LaunchFailure;
