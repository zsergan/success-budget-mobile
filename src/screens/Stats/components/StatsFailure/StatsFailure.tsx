import { Text, TouchableOpacity, View } from 'react-native';

import type { ErrorResponse } from '@api/dto';
import { Icon } from '@components';
import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';
import { formatErrorNote } from '@screens/Stats/format';

import styles from './style';

type Variant = 'loadFailed' | 'noAccess' | 'spacesFailed' | 'noSpaces' | 'noSpaceSelected';

interface Props {
  variant: Variant;
  error?: ErrorResponse;
  onAction: () => void;
}

const CONTENT: Record<Variant, { icon: IconType; title: string; text: string; action: string; actionIcon: IconType }> =
  {
    loadFailed: {
      icon: 'alert',
      title: 'Couldn’t load your stats',
      text: 'The request failed on our side, so nothing is missing from your data. Try again in a moment.',
      action: 'Retry',
      actionIcon: 'refresh',
    },
    noAccess: {
      icon: 'lock',
      title: 'No access to this space',
      text: 'You may have been removed from it, or it was deleted. Pick another space on Home.',
      action: 'Go to Home',
      actionIcon: 'home',
    },
    spacesFailed: {
      icon: 'alert',
      title: 'Couldn’t load your spaces',
      text: 'Stats belong to a space, and the list of yours didn’t arrive. Try again in a moment.',
      action: 'Retry',
      actionIcon: 'refresh',
    },
    noSpaces: {
      icon: 'users',
      title: 'No space yet',
      text: 'Stats belong to a space with its own wallets and currency. Create one to start.',
      action: 'Create a space',
      actionIcon: 'plus',
    },
    noSpaceSelected: {
      icon: 'users',
      title: 'No space selected',
      text: 'Stats belong to a space with its own wallets and currency. Choose one to see them.',
      action: 'Choose a space',
      actionIcon: 'users',
    },
  };

// Replaces the blocks when there is nothing to show; the period bar above stays usable.
const StatsFailure = ({ variant, error, onAction }: Props) => {
  const content = CONTENT[variant];

  return (
    <View style={styles.root} accessibilityRole="alert">
      <View style={styles.iconBox}>
        <Icon name={content.icon} size={28} color={colors.text} strokeWidth={1.8} />
      </View>

      <View style={styles.texts}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.text}>{content.text}</Text>
      </View>

      <TouchableOpacity style={styles.action} onPress={onAction} activeOpacity={0.8} accessibilityRole="button">
        <Icon name={content.actionIcon} size={16} color={colors.onAccent} strokeWidth={2.2} />
        <Text style={styles.actionText}>{content.action}</Text>
      </TouchableOpacity>

      {error && <Text style={styles.note}>{formatErrorNote(error)}</Text>}
    </View>
  );
};

export default StatsFailure;
