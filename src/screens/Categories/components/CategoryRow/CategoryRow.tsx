import { Text, TouchableOpacity, View } from 'react-native';

import { CategoryIconBox, Icon } from '@components';
import type { CategoryModel } from '@api/models';
import { colors } from '@shared/theme';
import { formatDayMonth } from '@shared/utils';

import styles from './style';

const metaText = (category: CategoryModel, archived: boolean) => {
  if (archived && category.archivedAt) {
    const count = category.transactionCount;

    return `Archived ${formatDayMonth(category.archivedAt)} · ${count} transaction${count === 1 ? '' : 's'}`;
  }

  if (category.transactionCount === 0) {
    return 'No transactions yet';
  }

  return `${category.transactionCount} transaction${category.transactionCount === 1 ? '' : 's'}`;
};

interface Props {
  category: CategoryModel;
  archived?: boolean;
  manual?: boolean;
  isActive?: boolean;
  onPress?: () => void;
  onDrag?: () => void;
  onRestore?: () => void;
}

const CategoryRow = ({
  category,
  archived = false,
  manual = false,
  isActive = false,
  onPress,
  onDrag,
  onRestore,
}: Props) => (
  <TouchableOpacity
    style={[styles.row, archived && styles.rowArchived, isActive && styles.rowActive]}
    onPress={archived || manual ? undefined : onPress}
    onLongPress={manual ? onDrag : undefined}
    activeOpacity={archived || manual ? 1 : 0.6}
  >
    <CategoryIconBox icon={category.icon} color={category.color} size={40} opacity={archived ? 0.45 : 1} />

    <View style={styles.textContainer}>
      <View style={styles.nameRow}>
        <Text style={[styles.name, archived && styles.nameArchived]} numberOfLines={1}>
          {category.name}
        </Text>

        {!archived && category.limit && (
          <View style={styles.limitPill}>
            <Text style={styles.limitPillText} numberOfLines={1}>
              {category.limit.name ?? 'Limit'}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.meta} numberOfLines={1}>
        {metaText(category, archived)}
      </Text>
    </View>

    <View style={styles.trailing}>
      {archived ? (
        <TouchableOpacity style={styles.restorePill} onPress={onRestore} activeOpacity={0.7}>
          <Icon name="refresh" size={12} color={colors.text} strokeWidth={2} />
          <Text style={styles.restorePillText}>Restore</Text>
        </TouchableOpacity>
      ) : manual ? (
        <TouchableOpacity onPressIn={onDrag} hitSlop={8}>
          <Icon name="list" size={18} color={colors.muted} strokeWidth={2} />
        </TouchableOpacity>
      ) : (
        <Icon name="forward" size={16} color={colors.muted} strokeWidth={2} />
      )}
    </View>
  </TouchableOpacity>
);

export default CategoryRow;
