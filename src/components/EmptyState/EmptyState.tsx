import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import Button from '../Buttons/Button/Button';
import Icon from '../Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import type { ThemeColors } from '@shared/theme';
import type { IconType } from '@shared/types';

import createStyles from './style';

type ActionVariant = 'primary' | 'secondary' | 'tertiary';

const actionIconColor = (variant: ActionVariant, colors: ThemeColors) =>
  ({ primary: colors.onAccent, secondary: colors.onSecondary, tertiary: colors.text })[variant];

export interface EmptyStateProps {
  icon: IconType;
  title: string;
  // A string, or text with nested <Text> for emphasis.
  description: ReactNode;
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
}: EmptyStateProps) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
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
          icon={actionIcon && <Icon name={actionIcon} size={16} color={actionIconColor(actionVariant, colors)} />}
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
};

export default EmptyState;
