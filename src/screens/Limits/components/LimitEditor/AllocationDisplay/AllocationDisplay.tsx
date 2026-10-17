import { Text, View } from 'react-native';

import type { LimitModel } from '@api/models';
import { useTheme, useThemedStyles } from '@hooks';
import { formatCurrencyAmount } from '@shared/utils';

import createStyles from './style';

interface Props {
  categoryLimits: LimitModel[];
  committedTotal: number;
  overCommitted: boolean;
  total?: LimitModel;
  currencyCode?: string;
}

const AllocationDisplay = ({ categoryLimits, committedTotal, overCommitted, total, currencyCode }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const allocationColors = [colors.accent, colors.accentDeep, colors.ok, colors.muted];

  return (
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
              backgroundColor: allocationColors[index % allocationColors.length],
            }}
          />
        ))}
      </View>

      {categoryLimits.map((categoryLimit, index) => (
        <View key={categoryLimit.id} style={styles.allocationRow}>
          <View
            style={[styles.allocationDot, { backgroundColor: allocationColors[index % allocationColors.length] }]}
          />

          <Text style={styles.allocationName}>{categoryLimit.name ?? categoryLimit.categories[0]?.name}</Text>

          <Text style={styles.allocationAmount}>
            {formatCurrencyAmount(Number(categoryLimit.amount), currencyCode)}
          </Text>
        </View>
      ))}

      {overCommitted && total && (
        <Text style={styles.takenHint}>
          {`Categories currently commit ${formatCurrencyAmount(committedTotal, currencyCode)} — ${formatCurrencyAmount(committedTotal - Number(total.amount), currencyCode)} above this total. Raising it makes both numbers agree.`}
        </Text>
      )}
    </View>
  );
};

export default AllocationDisplay;
