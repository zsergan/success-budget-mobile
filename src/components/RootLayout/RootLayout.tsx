import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import styles from './style';

interface Props {
  children: ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

type ContainerProps = Pick<Props, 'children' | 'style' | 'contentContainerStyle'>;

const ScrollViewContainer = ({ children, style, contentContainerStyle }: ContainerProps) => (
  <ScrollView
    showsVerticalScrollIndicator={false}
    style={[styles.container, style]}
    contentContainerStyle={contentContainerStyle}
    keyboardShouldPersistTaps="handled"
  >
    {children}
  </ScrollView>
);

const ViewContainer = ({ children, style }: ContainerProps) => (
  <View style={[styles.container, style]}>{children}</View>
);

const RootLayout = ({ children, scrollable, style, contentContainerStyle }: Props) => {
  const Container = scrollable ? ScrollViewContainer : ViewContainer;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <Container style={style} contentContainerStyle={contentContainerStyle}>
            {children}
          </Container>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RootLayout;
