import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import StatusBarBlur from '@components/StatusBarBlur/StatusBarBlur';
import theme from '@shared/theme';

import styles from './style';

interface Props {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  // Defaults to all 4 edges. A screen behind the bottom tab bar must pass
  // ['top','left','right'] -- the tab bar already reserves the bottom inset.
  edges?: Edge[];
  // Scrollable only: content scrolls under a blurred status bar instead of clipping at the top inset.
  blurredStatusBar?: boolean;
}

const ALL_EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];

type ContainerProps = Pick<Props, 'children' | 'style' | 'contentContainerStyle'>;

const ScrollViewContainer = ({ children, style, contentContainerStyle }: ContainerProps) => (
  <ScrollView
    showsVerticalScrollIndicator={false}
    style={[styles.container, style]}
    contentContainerStyle={contentContainerStyle}
    keyboardShouldPersistTaps="handled"
    keyboardDismissMode="on-drag"
  >
    {children}
  </ScrollView>
);

const ViewContainer = ({ children, style }: ContainerProps) => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={[styles.container, style]}>{children}</View>
  </TouchableWithoutFeedback>
);

const RootLayout = ({
  children,
  scrollable,
  style,
  contentContainerStyle,
  edges = ALL_EDGES,
  blurredStatusBar,
}: Props) => {
  const { top } = useSafeAreaInsets();
  const Container = scrollable ? ScrollViewContainer : ViewContainer;
  const underStatusBar = blurredStatusBar && scrollable;

  return (
    <SafeAreaView style={styles.root} edges={underStatusBar ? edges.filter((edge) => edge !== 'top') : edges}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Container
          style={[underStatusBar && styles.flushTop, style]}
          contentContainerStyle={[underStatusBar && { paddingTop: top + theme.spacing.md }, contentContainerStyle]}
        >
          {children}
        </Container>
      </KeyboardAvoidingView>

      {underStatusBar && <StatusBarBlur />}
    </SafeAreaView>
  );
};

export default RootLayout;
