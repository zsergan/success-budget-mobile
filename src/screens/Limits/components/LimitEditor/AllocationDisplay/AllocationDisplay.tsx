import { Text, View } from 'react-native';

import type { LimitModel } from '@api/models';
import { colors } from '@shared/theme';
import { formatCurrencyAmount } from '@shared/utils';

import styles from './style';

const ALLOCATION_COLORS = [colors.accent, '#8a5406', colors.ok, colors.muted];

interface Props {
  categoryLimits: LimitModel[];
  committedTotal: number;
  overCommitted: boolean;
  total?: LimitModel;
  currencyCode?: string;
}

const AllocationDisplay = ({ categoryLimits, committedTotal, overCommitted, total, currencyCode }: Props) => (
  <View style={styles.section}>
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabel}>Already committed to categories</Text>

      <Text style={[styles.sectionHint, overCommitted && { color: colors.warn }]}>
        {formatCurrencyAmount(committedTotal, currencyCode)}
      </Text>
    </View>

    <View style={styles.allocationBar}>
      {categoryLimits.map((categoryLimit, index) => (
        <View
          key={categoryLimit.id}
          style={{
            flex: Number(categoryLimit.amount),
            height: 10,
            backgroundColor: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
          }}
        />
      ))}
    </View>

    {categoryLimits.map((categoryLimit, index) => (
      <View key={categoryLimit.id} style={styles.allocationRow}>
        <View
          style={[styles.allocationDot, { backgroundColor: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }]}
        />

        <Text style={styles.allocationName}>{categoryLimit.name ?? categoryLimit.categories[0]?.name}</Text>

        <Text style={styles.allocationAmount}>{formatCurrencyAmount(Number(categoryLimit.amount), currencyCode)}</Text>
      </View>
    ))}

    {overCommitted && total && (
      <Text style={styles.takenHint}>
        {`Categories currently commit ${formatCurrencyAmount(committedTotal, currencyCode)} — ${formatCurrencyAmount(committedTotal - Number(total.amount), currencyCode)} above this total. Raising it makes both numbers agree.`}
      </Text>
    )}
  </View>
);

export default AllocationDisplay;
