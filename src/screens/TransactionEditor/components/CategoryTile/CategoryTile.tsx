import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import useCategoryAppearance from '@hooks/useCategoryAppearance';
import useLayout from '@hooks/useLayout';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import type { CategoryColor } from '@shared/categoryColors';
import type { IconType } from '@shared/types';

import createStyles from './style';

// Four tiles in a row; three once the system text is large enough to cut the names short.
export const useCategoryColumns = () => (useLayout().isLargeText ? 3 : 4);

type Props = {
  name: string;
  icon: IconType;
  columns: number;
  isSelected?: boolean;
  isArchived?: boolean;
  onPress: () => void;
  // A category takes its own colour; More and New are actions in the grid, not categories.
} & ({ color: CategoryColor; isAction?: never } | { color?: never; isAction: true });

// The selection is a neutral ring and a check, so it shows on a tile of any colour.
const CategoryTile = ({ name, icon, columns, color, isSelected = false, isArchived, isAction, onPress }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const appearance = useCategoryAppearance();
  const look = color === undefined ? null : appearance(color);

  return (
    <TouchableOpacity
      style={[styles.cell, { width: `${100 / columns}%` }]}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityState={isAction ? undefined : { selected: isSelected }}
    >
      <View
        style={[
          styles.box,
          isAction ? styles.boxAction : look && [styles.boxCategory, { backgroundColor: look.tint }],
          isSelected && styles.boxSelected,
        ]}
      >
        <Icon name={icon} size={22} color={look?.stroke ?? colors.muted} strokeWidth={1.8} />

        {isSelected && (
          <View style={styles.check}>
            <Icon name="check" size={11} color={colors.bg} strokeWidth={3} />
          </View>
        )}

        {isArchived && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Archived</Text>
          </View>
        )}
      </View>

      <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

export default CategoryTile;
