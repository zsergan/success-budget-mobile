import type { ReactNode } from 'react';
import { View, SafeAreaView } from 'react-native';

import { GradientBackground } from '@components';
import { palette } from '@shared/theme';

import styles from './style';

interface Props {
  children: ReactNode;
}

const AuthLayout = ({ children }: Props) => (
  <SafeAreaView style={styles.root}>
    <GradientBackground colors={[palette.greyLight, palette.grey]} />

    <View style={styles.main}>{children}</View>
  </SafeAreaView>
);

export default AuthLayout;
