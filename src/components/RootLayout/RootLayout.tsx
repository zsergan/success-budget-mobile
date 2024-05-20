import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Fragment } from 'react';
import { View, ScrollView } from 'react-native';

import styles from './style';

interface Props {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
}

const ScrollViewContainer = ({ children }: Pick<Props, 'children'>) => (
  <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
);

const RootLayout = ({ children, scrollable, style }: Props) => {
  const Container = scrollable ? ScrollViewContainer : Fragment;

  return (
    <Container>
      <View style={[styles.root, style]}>{children}</View>
    </Container>
  );
};

export default RootLayout;
