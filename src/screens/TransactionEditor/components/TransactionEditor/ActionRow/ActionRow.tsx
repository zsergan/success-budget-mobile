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
  // The keyboard is up: the panel steps aside so the fields get the room, and comes back pinned when it closes.
  isAboveKeyboard?: boolean;
  // Shown over Save in place of the helper text.
  banner?: ReactNode;
  onPress: () => void;
}

// The form's fixed action panel, pinned under the scrolling fields while the keyboard is down.
const ActionRow = ({ label, helperText, ready, isSaving, isAboveKeyboard = false, banner, onPress }: Props) => {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  if (isAboveKeyboard && !isSaving) return null;

  return (
    <View style={[styles.footer, { paddingBottom: theme.spacing.lg + insets.bottom }]}>
      {banner}

      {!banner && helperText && !isSaving && <Text style={styles.helperText}>{helperText}</Text>}

      <Button title={label} busyTitle="Saving…" isLoading={isSaving} disabled={!ready && !isSaving} onPress={onPress} />
    </View>
  );
};

export default ActionRow;
