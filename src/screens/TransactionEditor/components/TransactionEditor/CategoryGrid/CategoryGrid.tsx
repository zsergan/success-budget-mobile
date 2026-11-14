import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import CategoryTile, { useCategoryColumns } from '@screens/TransactionEditor/components/CategoryTile/CategoryTile';
import type { ListLoad } from '@screens/TransactionEditor/components/SectionLoad/SectionLoad';
import SectionLoad from '@screens/TransactionEditor/components/SectionLoad/SectionLoad';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { hexToRgba } from '@shared/utils';
import type { GridCategory } from './categoryLayout';
import { GRID_SLOTS } from './categoryLayout';

import createStyles from './style';

const GHOSTS = Array.from({ length: GRID_SLOTS }, (_, index) => index);

interface Props {
  load: ListLoad;
  tiles: GridCategory[];
  hasMore: boolean;
  selectedId: number | null;
  // The record's own archived category, offered while it fits the draft's type.
  archived: GridCategory | null;
  typeColor: string;
  // "income" or "expense", as the empty state names it.
  typeWord: string;
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
  archived,
  typeColor,
  typeWord,
  onSelect,
  onMore,
  onCreate,
  onRetry,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const columns = useCategoryColumns();
  const selected = tiles.find(({ id }) => id === selectedId);
  const keepsArchived = !!archived && selected?.id === archived.id;
  // The tile cuts a long name short; the pill has room for it.
  const pill = selected ? (keepsArchived ? `${selected.name} · archived` : selected.name) : 'Required';

  return (
    <View style={styles.section}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Category</Text>

        {load === 'ready' && tiles.length > 0 && (
          <View style={[styles.pill, selected && { backgroundColor: hexToRgba(typeColor, 0.1) }]}>
            <Text style={[styles.pillText, selected && { color: typeColor }]} numberOfLines={1}>
              {pill}
            </Text>
          </View>
        )}
      </View>

      {load === 'loading' ? (
        <View style={styles.grid} accessibilityLabel="Loading categories">
          {GHOSTS.map((ghost) => (
            <View key={ghost} style={[styles.ghostCell, { width: `${100 / columns}%` }]}>
              <View style={styles.ghostBox} />
              <View style={styles.ghostName} />
            </View>
          ))}
        </View>
      ) : load === 'failed' ? (
        <SectionLoad load={load} name="categories" icon="grid" onRetry={onRetry} />
      ) : tiles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No {typeWord} categories yet</Text>
          <Text style={styles.emptyText}>Create one — you’ll come back to this transaction.</Text>

          <TouchableOpacity
            style={styles.createButton}
            onPress={onCreate}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Icon name="plus" size={14} color={colors.onSecondary} strokeWidth={2.3} />
            <Text style={styles.createButtonText}>Create category</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.grid}>
          {tiles.map((category) => (
            <CategoryTile
              key={category.id}
              name={category.name}
              icon={category.icon}
              columns={columns}
              typeColor={typeColor}
              isSelected={category.id === selectedId}
              isArchived={category.id === archived?.id}
              onPress={() => onSelect(category.id)}
            />
          ))}

          {hasMore && (
            <CategoryTile name="More" icon="more" columns={columns} typeColor={typeColor} isAction onPress={onMore} />
          )}
        </View>
      )}

      {archived && load === 'ready' && (
        <View style={styles.noteRow}>
          <Icon name="info" size={14} color={colors.muted} strokeWidth={1.9} />
          <Text style={styles.note}>
            {keepsArchived
              ? 'Archived category. You can keep it, or pick an active one — the archived tile stays until you save.'
              : `${archived.name} is archived. Your new choice replaces it on save.`}
          </Text>
        </View>
      )}
    </View>
  );
};

export default CategoryGrid;
