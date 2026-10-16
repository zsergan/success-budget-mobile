import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { hexToRgba } from '@shared/utils';
import type { ListLoad } from '@components/TransactionFlow/SectionLoad/SectionLoad';
import SectionLoad from '@components/TransactionFlow/SectionLoad/SectionLoad';
import type { GridCategory } from './categoryLayout';

import createStyles from './style';

interface Props {
  load: ListLoad;
  tiles: GridCategory[];
  hasMore: boolean;
  selectedId: number | null;
  archivedId: number | null;
  typeColor: string;
  emptyLabel: string;
  onSelect: (categoryId: number) => void;
  onMore: () => void;
  onCreate: () => void;
  onRetry: () => void;
}

const CategoryGrid = ({
  load,
  tiles,
  hasMore,
  selectedId,
  archivedId,
  typeColor,
  emptyLabel,
  onSelect,
  onMore,
  onCreate,
  onRetry,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const selected = tiles.find(({ id }) => id === selectedId);
  const hint =
    selected && selected.id === archivedId ? 'Archived — you can keep it' : (selected?.name ?? 'Choose category');

  return (
    <View style={styles.section}>
      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>Category</Text>
        <Text style={[styles.sectionHint, selected && { color: typeColor }]}>{hint}</Text>
      </View>

      {load !== 'ready' ? (
        <SectionLoad load={load} name="categories" onRetry={onRetry} />
      ) : tiles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{emptyLabel}</Text>

          <TouchableOpacity style={styles.createButton} onPress={onCreate} activeOpacity={0.7}>
            <Icon name="plus" size={14} color={colors.text} strokeWidth={2.1} />
            <Text style={styles.createButtonText}>Create category</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.categoryGrid}>
          {tiles.map((category) => {
            const isSelected = category.id === selectedId;

            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCell}
                onPress={() => onSelect(category.id)}
                activeOpacity={0.6}
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  style={[
                    styles.categoryIconBox,
                    isSelected && { backgroundColor: hexToRgba(typeColor, 0.1), borderColor: typeColor },
                  ]}
                >
                  <Icon name={category.icon} size={22} color={isSelected ? typeColor : colors.text} />
                </View>

                <Text style={[styles.categoryName, isSelected && { color: typeColor }]} numberOfLines={2}>
                  {category.name}
                </Text>

                {category.id === archivedId && <Text style={styles.archivedBadge}>Archived</Text>}
              </TouchableOpacity>
            );
          })}

          {hasMore && (
            <TouchableOpacity style={styles.categoryCell} onPress={onMore} activeOpacity={0.6}>
              <View style={styles.categoryIconBox}>
                <Icon name="more" size={22} color={colors.text} />
              </View>

              <Text style={styles.categoryName}>More</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default CategoryGrid;
