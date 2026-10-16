import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, RootLayout, TextLink, TinyButton } from '@components';
import { useKeyboardHeight } from '@hooks';
import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';

import styles, { BOTTOM_GAP } from './style';

const ILLUSTRATION_TONES = {
  neutral: { background: colors.track, icon: colors.text },
  ok: { background: colors.okSoft, icon: colors.ok },
};

interface Props {
  title: string;
  // Left out where a small screen with the keyboard up needs the room.
  description?: string;
  // Hidden while the keyboard is up, so the form and its action keep the room.
  illustration?: { icon: IconType; tone: keyof typeof ILLUSTRATION_TONES };
  // Under the description, part of the header (e.g. the address a code went to).
  headerAccessory?: ReactNode;
  onBackButtonPress: () => void;
  children: ReactNode;
  action: ReactNode;
  prompt?: { text: string; linkTitle: string; onLinkPress: () => void };
}

const AuthFormLayout = ({
  title,
  description,
  illustration,
  headerAccessory,
  onBackButtonPress,
  children,
  action,
  prompt,
}: Props) => {
  const { bottom } = useSafeAreaInsets();
  const isKeyboardUp = useKeyboardHeight() > 0;
  const illustrationTone = illustration && ILLUSTRATION_TONES[illustration.tone];

  const footer = (
    <View style={[styles.footer, isKeyboardUp && styles.footerPinned]}>
      {action}

      {prompt && (
        <View style={styles.prompt}>
          <Text style={styles.promptText}>{prompt.text}</Text>

          <TextLink title={prompt.linkTitle} onPress={prompt.onLinkPress} />
        </View>
      )}
    </View>
  );

  return (
    <RootLayout
      scrollable
      edges={['top', 'left', 'right']}
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: isKeyboardUp ? 0 : Math.max(BOTTOM_GAP, bottom) }]}
      // With the keyboard up the action is pinned above it; otherwise it follows the content, even at large text sizes.
      footer={isKeyboardUp ? footer : undefined}
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
        {illustration && illustrationTone && !isKeyboardUp && (
          <View style={[styles.illustration, { backgroundColor: illustrationTone.background }]}>
            <Icon name={illustration.icon} size={32} color={illustrationTone.icon} strokeWidth={2.2} />
          </View>
        )}

        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>

        {description && <Text style={styles.description}>{description}</Text>}

        {headerAccessory}
      </View>

      <View style={styles.body}>{children}</View>

      <View style={styles.spacer} />

      {!isKeyboardUp && footer}
    </RootLayout>
  );
};

export default AuthFormLayout;
