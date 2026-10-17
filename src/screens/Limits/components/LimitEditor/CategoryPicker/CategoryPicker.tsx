import { Text, TouchableOpacity, View } from 'react-native';

import type { CategoryModel } from '@api/models';
import { Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { hexToRgba } from '@shared/utils';

import createStyles from './style';

interface Props {
  categories: CategoryModel[];
  categoryIds: number[];
  claimedElsewhere: Set<number>;
  isGroup: boolean;
  error?: string;
  onToggleCategory: (categoryId: number) => void;
}

const CategoryPicker = ({ categories, categoryIds, claimedElsewhere, isGroup, error, onToggleCategory }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>{isGroup ? 'Categories in this limit' : 'Category'}</Text>

        <Text style={styles.sectionHint}>{`${categoryIds.length} selected`}</Text>
      </View>

      <View style={styles.categoryGrid}>
        {categories.map((category) => {
          const selected = categoryIds.includes(category.id);
          const taken = claimedElsewhere.has(category.id);

          return (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCell}
              onPress={() => !taken && onToggleCategory(category.id)}
              disabled={taken}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.categoryIconBox,
                  selected && { backgroundColor: hexToRgba(colors.accent, 0.12), borderColor: colors.accent },
                ]}
              >
                <Icon
                  name={category.icon}
                  size={22}
                  color={selected ? colors.accent : taken ? colors.muted : colors.text}
                />

                {selected && (
                  <View style={styles.selectedBadge}>
                    <Icon name="check" size={10} color={colors.onAccent} strokeWidth={3.4} />
                  </View>
                )}

                {taken && !selected && (
                  <View style={styles.takenBadge}>
                    <Icon name="minus" size={9} color={colors.muted} strokeWidth={3} />
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.categoryName,
                  selected && styles.categoryNameSelected,
                  taken && styles.categoryNameTaken,
                ]}
                numberOfLines={2}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {isGroup && claimedElsewhere.size > 0 && (
        <Text style={styles.takenHint}>Greyed-out categories already belong to another limit.</Text>
      )}
    </View>
  );
};

export default CategoryPicker;
