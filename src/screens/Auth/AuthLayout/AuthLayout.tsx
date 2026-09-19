import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground, TinyButton } from '@components';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  children: ReactNode;
  onBackButtonPress?: () => void;
}

const AuthLayout = ({ children, onBackButtonPress }: Props) => (
  <SafeAreaView style={styles.root}>
    <GradientBackground colors={[colors.bg, colors.track]} />

    {onBackButtonPress && (
      <View style={styles.backButton}>
        <TinyButton icon="back" onPress={onBackButtonPress} />
      </View>
    )}

    <View style={styles.main}>{children}</View>
  </SafeAreaView>
);

export default AuthLayout;
