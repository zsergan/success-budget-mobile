import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

import ScreenFrame, { useScreenTopInset } from '@components/ScreenFrame/ScreenFrame';
import theme from '@shared/theme';

import styles from './style';

interface Props {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  // Scrollable only: content scrolls under a blurred status bar instead of clipping at the top inset.
  blurredStatusBar?: boolean;
}

type ContainerProps = Pick<Props, 'children' | 'style' | 'contentContainerStyle'>;

const ScrollViewContainer = ({ children, style, contentContainerStyle }: ContainerProps) => {
  const topInset = useScreenTopInset();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[styles.container, topInset > 0 && styles.flushTop, style]}
      contentContainerStyle={[topInset > 0 && { paddingTop: topInset + theme.spacing.md }, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {children}
    </ScrollView>
  );
};

const ViewContainer = ({ children, style }: ContainerProps) => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={[styles.container, style]}>{children}</View>
  </TouchableWithoutFeedback>
);

const RootLayout = ({ children, scrollable, style, contentContainerStyle, edges, blurredStatusBar }: Props) => {
  const Container = scrollable ? ScrollViewContainer : ViewContainer;

  return (
    <ScreenFrame edges={edges} blurredStatusBar={blurredStatusBar && scrollable}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Container style={style} contentContainerStyle={contentContainerStyle}>
          {children}
        </Container>
      </KeyboardAvoidingView>
    </ScreenFrame>
  );
};

export default RootLayout;
