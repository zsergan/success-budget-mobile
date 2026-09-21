import { Text, TouchableOpacity, View } from 'react-native';

import type { LimitModel } from '@api/models';
import { EmptyState, Icon, LimitItem } from '@components';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  categoryLimits: LimitModel[];
  currencyCode?: string;
  onAddLimit: () => void;
  onSelectLimit: (limit: LimitModel) => void;
}

const CategoryLimitsSection = ({ categoryLimits, currencyCode, onAddLimit, onSelectLimit }: Props) => {
  if (categoryLimits.length === 0) {
    return (
      <EmptyState
        variant="solid"
        icon="limit"
        title="No category limits yet"
        description="The monthly total tells you how much is left. Category limits tell you where it goes — groceries, transport, or a group like «Fun»."
        actionLabel="Add first category limit"
        actionVariant="secondary"
        actionIcon="plus"
        onActionPress={onAddLimit}
      />
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Category limits</Text>

        <TouchableOpacity style={styles.addButton} onPress={onAddLimit} activeOpacity={0.7}>
          <Icon name="plus" size={12} color={colors.text} strokeWidth={2.2} />

          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {categoryLimits.map((limit) => (
          <LimitItem key={limit.id} limit={limit} currencyCode={currencyCode} onPress={() => onSelectLimit(limit)} />
        ))}
      </View>
    </View>
  );
};

export default CategoryLimitsSection;
