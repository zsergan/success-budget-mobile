import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { ScrollView, StyleProp, ViewStyle } from 'react-native';
import { View, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

import FrameScrollView from '@components/ScreenFrame/FrameScrollView';
import ScreenFrame from '@components/ScreenFrame/ScreenFrame';
import { FieldRevealProvider, useFieldRevealScroll } from './FieldReveal';

import styles from './style';

interface Props {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  // Scrollable only: content scrolls under a blurred status bar instead of clipping at the top inset.
  blurredStatusBar?: boolean;
  // Below the content, outside its scroll: it stays right above the keyboard however long the content is.
  footer?: ReactNode;
}

type ContainerProps = Pick<Props, 'children' | 'style' | 'contentContainerStyle'>;

const ScrollViewContainer = ({ children, style, contentContainerStyle }: ContainerProps) => {
  const scrollRef = useRef<ScrollView>(null);
  const fieldReveal = useFieldRevealScroll(scrollRef);

  return (
    <FrameScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      scrollEventThrottle={16}
      onScroll={fieldReveal.onScroll}
      onLayout={fieldReveal.onLayout}
    >
      <FieldRevealProvider value={fieldReveal.value}>{children}</FieldRevealProvider>
    </FrameScrollView>
  );
};

const ViewContainer = ({ children, style }: ContainerProps) => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={[styles.container, style]}>{children}</View>
  </TouchableWithoutFeedback>
);

const RootLayout = ({ children, scrollable, style, contentContainerStyle, edges, blurredStatusBar, footer }: Props) => {
  const Container = scrollable ? ScrollViewContainer : ViewContainer;

  return (
    <ScreenFrame edges={edges} blurredStatusBar={blurredStatusBar && scrollable}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Container style={style} contentContainerStyle={contentContainerStyle}>
          {children}
        </Container>

        {footer}
      </KeyboardAvoidingView>
    </ScreenFrame>
  );
};

export default RootLayout;
