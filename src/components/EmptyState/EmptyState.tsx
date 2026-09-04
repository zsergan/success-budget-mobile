import { Text, View } from 'react-native';

import Button from '../Buttons/Button/Button';
import Icon from '../Icon/Icon';
import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';

import styles from './style';

type ActionVariant = 'primary' | 'secondary' | 'tertiary';

const ACTION_ICON_COLOR: Record<ActionVariant, string> = {
  primary: colors.onAccent,
  secondary: colors.onSecondary,
  tertiary: colors.text,
};

export interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
  /** 'dashed' (default) matches the original "nothing here" card; 'solid' is for a filtered/scoped-empty state — data exists, just not in view. */
  variant?: 'dashed' | 'solid';
  actionLabel?: string;
  actionIcon?: IconType;
  actionVariant?: ActionVariant;
  onActionPress?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
}

const EmptyState = ({
  icon,
  title,
  description,
  variant = 'dashed',
  actionLabel,
  actionIcon,
  actionVariant = 'primary',
  onActionPress,
  secondaryActionLabel,
  onSecondaryActionPress,
}: EmptyStateProps) => (
  <View style={[styles.root, variant === 'solid' && styles.solidRoot]}>
    <View style={styles.iconBox}>
      <Icon name={icon} size={26} color={colors.text} strokeWidth={1.6} />
    </View>

    <View style={styles.textContainer}>
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.description}>{description}</Text>
    </View>

    {actionLabel && onActionPress && (
      <Button
        title={actionLabel}
        variant={actionVariant}
        onPress={onActionPress}
        icon={actionIcon && <Icon name={actionIcon} size={16} color={ACTION_ICON_COLOR[actionVariant]} />}
        style={styles.action}
        withShadow={actionVariant === 'primary'}
      />
    )}

    {secondaryActionLabel && onSecondaryActionPress && (
      <Button
        title={secondaryActionLabel}
        variant="tertiary"
        onPress={onSecondaryActionPress}
        style={[styles.action, styles.secondaryActionBorder]}
      />
    )}
  </View>
);

export default EmptyState;
