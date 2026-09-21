import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

import styles from './style';

interface Props {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  // Defaults to all 4 edges. A screen behind the bottom tab bar must pass
  // ['top','left','right'] -- the tab bar already reserves the bottom inset.
  edges?: Edge[];
}

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

const RootLayout = ({ children, scrollable, style, contentContainerStyle, edges }: Props) => {
  const Container = scrollable ? ScrollViewContainer : ViewContainer;

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Container style={style} contentContainerStyle={contentContainerStyle}>
          {children}
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RootLayout;
