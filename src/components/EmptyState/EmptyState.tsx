import { Text, View } from 'react-native';

import Button from '../Buttons/Button/Button';
import Icon from '../Icon/Icon';
import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';

import styles from './style';

export interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: IconType;
  onActionPress?: () => void;
}

const EmptyState = ({ icon, title, description, actionLabel, actionIcon, onActionPress }: EmptyStateProps) => (
  <View style={styles.root}>
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
        onPress={onActionPress}
        icon={actionIcon && <Icon name={actionIcon} size={16} color={colors.onAccent} />}
        style={styles.action}
        withShadow
      />
    )}
  </View>
);

export default EmptyState;
