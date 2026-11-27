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
  // The keyboard is up: the panel ends the scrolling form instead of being pinned on top of the keyboard.
  isInline?: boolean;
  // Shown over Save in place of the helper text.
  banner?: ReactNode;
  onPress: () => void;
}

// The form's action panel: pinned under the scrolling fields while the keyboard is down, the end of the form while
// it is up, so it never rides on the keyboard.
const ActionRow = ({ label, helperText, ready, isSaving, isInline = false, banner, onPress }: Props) => {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={isInline ? styles.inline : [styles.footer, { paddingBottom: theme.spacing.lg + insets.bottom }]}>
      {banner}

      {!banner && helperText && !isSaving && <Text style={styles.helperText}>{helperText}</Text>}

      <Button title={label} busyTitle="Saving…" isLoading={isSaving} disabled={!ready && !isSaving} onPress={onPress} />
    </View>
  );
};

export default ActionRow;
