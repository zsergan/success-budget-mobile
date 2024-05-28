import type { ReactNode } from 'react';
import { View } from 'react-native';

import { GradientBackground, H } from '@components';
import { palette } from '@shared/theme';

import styles from './style';

interface Props {
  children: ReactNode;
  header: string;
}

const AuthLayout = ({ children, header }: Props) => {
  return (
    <View style={styles.root}>
      <GradientBackground colors={[palette.greyLight, palette.grey]} />

      <H style={styles.h}>{header}</H>

      {children}
    </View>
  );
};

export default AuthLayout;
