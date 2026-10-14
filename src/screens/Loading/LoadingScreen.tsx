import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { Icon, TinyButton } from '@components';
import type { LaunchProgress } from '@navigation/launchState';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  launch: LaunchProgress;
  onRetry: () => void;
}

const FAILURE_TEXT = {
  storedSession: 'This device didn’t give back your saved session. Try again.',
  network: 'The server didn’t answer. Check your connection and try again.',
};

const LoadingScreen = ({ launch, onRetry }: Props) => {
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

      {launch.status === 'failed' ? (
        <View style={styles.progressContainer}>
          <Text style={styles.failureTitle}>Couldn’t check your session</Text>
          <Text style={styles.status}>
            {launch.stage === 'storedSession' ? FAILURE_TEXT.storedSession : FAILURE_TEXT.network}
          </Text>
          <TinyButton title="Try again" size="lg" onPress={onRetry} />
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
