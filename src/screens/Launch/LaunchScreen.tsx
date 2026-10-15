import { useEffect } from 'react';
import { AccessibilityInfo, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLockup } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import type { LaunchStage } from '@redux/state/launch/initialState';
import { selectLaunch } from '@redux/state/launch/selectors';
import { retryLaunch } from '@redux/state/launch/thunks';

import LaunchFailure from './components/LaunchFailure/LaunchFailure';
import LaunchIndicator from './components/LaunchIndicator/LaunchIndicator';
import useLaunchWait from './hooks/useLaunchWait';
import styles, { FAILURE_BOTTOM, PROGRESS_BOTTOM, TEXT_SCALE_LIMIT } from './style';

const PROGRESS_FADE_MS = 200;

// What the attempt is doing now: the session first, then the budgets it opens.
const STATUS: Record<LaunchStage, { now: string; slow: string }> = {
  resources: { now: 'Starting the app…', slow: 'Still starting the app…' },
  storedSession: { now: 'Checking your session…', slow: 'Still checking your session…' },
  session: { now: 'Checking your session…', slow: 'Still checking your session…' },
  requiredData: { now: 'Loading your budgets…', slow: 'Still loading your budgets…' },
};

const SLOW_NOTE = 'This is taking longer than usual. Check your connection.';

// Continues the system launch screen: the lockup is drawn where the system drew it (see style.ts) and never moves;
// only the area under it changes, between nothing, the progress and a failure.
const LaunchScreen = () => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { phase, stage, failure, retryAt, startedAt } = useAppSelector(selectLaunch);
  const { showsProgress, isSlow } = useLaunchWait(startedAt, phase === 'running');
  const status = isSlow ? STATUS[stage].slow : STATUS[stage].now;
  const isFailed = phase === 'failed' && failure !== null;

  useEffect(() => {
    if (showsProgress) AccessibilityInfo.announceForAccessibility(isSlow ? `${status} ${SLOW_NOTE}` : status);
  }, [showsProgress, isSlow, status]);

  const bottom = Math.max(isFailed ? FAILURE_BOTTOM : PROGRESS_BOTTOM, insets.bottom + 24);

  return (
    <View style={styles.root}>
      <View style={styles.lockup}>
        <BrandLockup layout="stacked" fadeInText={Platform.OS === 'android'} />
      </View>

      {/* Large system text can outgrow the room under the logo: then this area scrolls instead of cutting it off. */}
      <ScrollView
        style={styles.below}
        contentContainerStyle={[styles.belowContent, { paddingBottom: bottom }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {isFailed ? (
          <LaunchFailure failure={failure} retryAt={retryAt} onRetry={() => dispatch(retryLaunch())} />
        ) : (
          showsProgress && (
            <Animated.View
              entering={FadeIn.duration(PROGRESS_FADE_MS)}
              style={styles.progress}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={isSlow ? `${status} ${SLOW_NOTE}` : status}
              accessibilityState={{ busy: true }}
            >
              <LaunchIndicator />

              <View style={styles.status}>
                <Text maxFontSizeMultiplier={TEXT_SCALE_LIMIT} style={styles.statusText}>
                  {status}
                </Text>
                {isSlow && (
                  <Text maxFontSizeMultiplier={TEXT_SCALE_LIMIT} style={styles.statusSub}>
                    {SLOW_NOTE}
                  </Text>
                )}
              </View>
            </Animated.View>
          )
        )}
      </ScrollView>
    </View>
  );
};

export default LaunchScreen;
