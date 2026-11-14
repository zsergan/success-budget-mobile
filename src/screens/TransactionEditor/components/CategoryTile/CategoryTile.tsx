import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import type { IconType } from '@shared/types';
import { hexToRgba } from '@shared/utils';

import createStyles from './style';

const LARGE_TEXT_SCALE = 1.15;

// Four tiles in a row; three once the system text is large enough to cut the names short.
export const useCategoryColumns = () => (useWindowDimensions().fontScale > LARGE_TEXT_SCALE ? 3 : 4);

interface Props {
  name: string;
  icon: IconType;
  columns: number;
  typeColor: string;
  isSelected?: boolean;
  isArchived?: boolean;
  // More and New: an action in the grid, not a category.
  isAction?: boolean;
  onPress: () => void;
}

const CategoryTile = ({ name, icon, columns, typeColor, isSelected = false, isArchived, isAction, onPress }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

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
          isAction && styles.boxAction,
          isSelected && styles.boxSelected,
          isSelected && { backgroundColor: hexToRgba(typeColor, 0.12), borderColor: typeColor },
        ]}
      >
        <Icon name={icon} size={22} color={isSelected ? typeColor : isAction ? colors.muted : colors.text} />

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
