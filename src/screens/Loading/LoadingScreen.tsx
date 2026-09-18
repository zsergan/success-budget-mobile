import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { Icon } from '@components';
import { colors } from '@shared/theme';

import styles from './style';

const LoadingScreen = () => {
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

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width }]} />
        </View>

        <Text style={styles.status}>Checking your session…</Text>
      </View>
    </View>
  );
};

export default LoadingScreen;
