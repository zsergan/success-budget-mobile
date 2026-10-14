import { Platform, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BrandLockup } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectLaunch } from '@redux/state/launch/selectors';
import { retryLaunch } from '@redux/state/launch/thunks';

import LaunchFailure from './components/LaunchFailure/LaunchFailure';
import LaunchIndicator from './components/LaunchIndicator/LaunchIndicator';
import useLaunchWait from './hooks/useLaunchWait';
import styles from './style';

const PROGRESS_FADE_MS = 200;

// Continues the system launch screen: the lockup is drawn where the system drew it (see style.ts) and never moves;
// only the progress or a failure appears under it.
const LaunchScreen = () => {
  const dispatch = useAppDispatch();
  const { phase, failure, retryAt, startedAt } = useAppSelector(selectLaunch);
  const { showsProgress, isSlow } = useLaunchWait(startedAt, phase === 'running');

  return (
    <View style={styles.root}>
      <View style={styles.lockup}>
        <BrandLockup layout="stacked" fadeInText={Platform.OS === 'android'} />
      </View>

      {showsProgress && (
        <Animated.View entering={FadeIn.duration(PROGRESS_FADE_MS)} style={styles.progress}>
          <LaunchIndicator />

          <View style={styles.status}>
            <Text style={styles.statusText}>{isSlow ? 'Still checking your session…' : 'Checking your session…'}</Text>
            {isSlow && <Text style={styles.statusSub}>This is taking longer than usual. Check your connection.</Text>}
          </View>
        </Animated.View>
      )}

      {phase === 'failed' && failure && (
        <View style={styles.failure}>
          <LaunchFailure failure={failure} retryAt={retryAt} onRetry={() => dispatch(retryLaunch())} />
        </View>
      )}
    </View>
  );
};

export default LaunchScreen;
