import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@components/Buttons/Button/Button';
import useThemedStyles from '@hooks/useThemedStyles';
import theme from '@shared/theme';

import createStyles from './style';

interface Props {
  label: string;
  // Why Save cannot be pressed yet.
  helperText?: string;
  ready: boolean;
  isSaving: boolean;
  // The home indicator is under the keyboard then, so its inset is not kept.
  isAboveKeyboard?: boolean;
  // Shown over Save in place of the helper text.
  banner?: ReactNode;
  onPress: () => void;
}

// The form's fixed action panel: it stays under the scrolling fields and rides up with the keyboard.
const ActionRow = ({ label, helperText, ready, isSaving, isAboveKeyboard = false, banner, onPress }: Props) => {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.footer, { paddingBottom: isAboveKeyboard ? theme.spacing.md : theme.spacing.lg + insets.bottom }]}
    >
      {banner}

      {!banner && helperText && !isSaving && <Text style={styles.helperText}>{helperText}</Text>}

      <Button title={label} busyTitle="Saving…" isLoading={isSaving} disabled={!ready && !isSaving} onPress={onPress} />
    </View>
  );
};

export default ActionRow;
