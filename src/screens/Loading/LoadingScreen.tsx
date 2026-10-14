import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { Icon, TinyButton } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import type { LaunchFailure } from '@redux/state/launch/initialState';
import { selectLaunch } from '@redux/state/launch/selectors';
import { retryLaunch } from '@redux/state/launch/thunks';
import { colors } from '@shared/theme';

import styles from './style';

// Each failure names what to do next; only `offline` is about the user's connection.
const FAILURE_COPY: Record<LaunchFailure, { title: string; text: string }> = {
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

const LoadingScreen = () => {
  const dispatch = useAppDispatch();
  const { phase, failure, retryAt } = useAppSelector(selectLaunch);
  const waitSeconds = useSecondsUntil(phase === 'failed' ? retryAt : null);

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '70%'] });

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Icon name="chart" size={48} color={colors.onAccent} strokeWidth={2.1} />
      </View>

      <View style={styles.wordmarkContainer}>
        <Text style={styles.wordmark}>Success Budget</Text>
        <Text style={styles.subtitle}>Personal and shared budgets</Text>
      </View>

      {phase === 'failed' && failure ? (
        <View style={styles.progressContainer}>
          <Text style={styles.failureTitle}>{FAILURE_COPY[failure].title}</Text>
          <Text style={styles.status}>{FAILURE_COPY[failure].text}</Text>
          <TinyButton
            title={waitSeconds > 0 ? `Try again in ${waitSeconds} s` : 'Try again'}
            size="lg"
            disabled={waitSeconds > 0}
            onPress={() => dispatch(retryLaunch())}
          />
        </View>
      ) : (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width }]} />
          </View>

          <Text style={styles.status}>Checking your session…</Text>
        </View>
      )}
    </View>
  );
};

export default LoadingScreen;
