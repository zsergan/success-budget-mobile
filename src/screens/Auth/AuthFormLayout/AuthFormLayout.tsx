import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootLayout, TextLink, TinyButton } from '@components';

import styles, { BOTTOM_GAP } from './style';

interface Props {
  title: string;
  description: string;
  onBackButtonPress: () => void;
  children: ReactNode;
  action: ReactNode;
  prompt?: { text: string; linkTitle: string; onLinkPress: () => void };
}

const AuthFormLayout = ({ title, description, onBackButtonPress, children, action, prompt }: Props) => {
  const { bottom } = useSafeAreaInsets();

  return (
    <RootLayout
      scrollable
      edges={['top', 'left', 'right']}
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(BOTTOM_GAP, bottom) }]}
    >
      <View style={styles.backRow}>
        <TinyButton
          icon="back"
          size="lg"
          iconWrap={false}
          strokeWidth={2}
          accessibilityLabel="Back"
          onPress={onBackButtonPress}
        />
      </View>

      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>

        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.body}>{children}</View>

      <View style={styles.spacer} />

      <View style={styles.footer}>
        {action}

        {prompt && (
          <View style={styles.prompt}>
            <Text style={styles.promptText}>{prompt.text}</Text>

            <TextLink title={prompt.linkTitle} onPress={prompt.onLinkPress} />
          </View>
        )}
      </View>
    </RootLayout>
  );
};

export default AuthFormLayout;
