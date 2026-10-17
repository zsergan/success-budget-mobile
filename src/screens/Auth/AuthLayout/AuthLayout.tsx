import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@components';
import { useTheme } from '@hooks';

import styles from './style';

interface Props {
  children: ReactNode;
}

const AuthLayout = ({ children }: Props) => {
  const { colors } = useTheme().colorTheme;

  return (
    <SafeAreaView style={styles.root}>
      <GradientBackground colors={[colors.bg, colors.track]} />

      <View style={styles.main}>{children}</View>
    </SafeAreaView>
  );
};

export default AuthLayout;
