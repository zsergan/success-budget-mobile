import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View, ScrollView, SafeAreaView } from 'react-native';

import styles from './style';

interface Props {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
}

type ContainerProps = Pick<Props, 'children' | 'style'>;

const ScrollViewContainer = ({ children, style }: ContainerProps) => (
  <ScrollView showsVerticalScrollIndicator={false} style={[styles.container, style]}>
    {children}
  </ScrollView>
);

const ViewContainer = ({ children, style }: ContainerProps) => (
  <View style={[styles.container, style]}>{children}</View>
);

const RootLayout = ({ children, scrollable, style }: Props) => {
  const Container = scrollable ? ScrollViewContainer : ViewContainer;

  return (
    <SafeAreaView style={styles.root}>
      <Container style={style}>{children}</Container>
    </SafeAreaView>
  );
};

export default RootLayout;
