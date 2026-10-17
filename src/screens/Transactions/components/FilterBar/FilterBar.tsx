import { ActivityIndicator, Text, View } from 'react-native';

import type { Money } from '@api/dto';
import { Icon, PeriodBar } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import type { Period, PeriodUnit } from '@shared/utils';
import { formatMoneyAmount } from '@shared/utils';

import createStyles from './style';

// What a search has found so far: still asking, its count, or a failed request (count unknown).
export type SearchStatus = { state: 'searching' } | { state: 'found'; count: number } | { state: 'failed' };

interface Props {
  period: Period;
  // Null while the selection has no answer yet: shown as a placeholder while loading, as "—" once it failed.
  income: Money | null;
  expense: Money | null;
  isLoading: boolean;
  search?: SearchStatus;
  currencyCode?: string;
  onPresetPress: (unit: PeriodUnit) => void;
  onOpenPicker: () => void;
  onReset: () => void;
}

const UNKNOWN = '—';

const matchCount = (count: number) => `${count} ${count === 1 ? 'match' : 'matches'}`;

const TotalValue = ({
  value,
  isLoading,
  currencyCode,
}: {
  value: Money | null;
  isLoading: boolean;
  currencyCode?: string;
}) => {
  const styles = useThemedStyles(createStyles);
  if (value !== null) return <Text style={styles.totalValue}>{formatMoneyAmount(value, currencyCode)}</Text>;

  return isLoading ? (
    <View style={styles.totalPlaceholder} testID="total-placeholder" />
  ) : (
    <Text style={[styles.totalValue, styles.totalUnknown]}>{UNKNOWN}</Text>
  );
};

const FilterBar = ({
  period,
  income,
  expense,
  isLoading,
  search,
  currencyCode,
  onPresetPress,
  onOpenPicker,
  onReset,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <PeriodBar period={period} onPresetPress={onPresetPress} onOpenPicker={onOpenPicker} onReset={onReset} />

      {/* Always kept, at one height, so neither opening search nor its status shifts what is under it. */}
      <View style={styles.searchRow} testID="search-status">
        {search && (
          <>
            <View style={styles.searchLabelRow}>
              {search.state === 'searching' && <ActivityIndicator size="small" color={colors.muted} />}
              <Text style={styles.searchLabel}>{search.state === 'searching' ? 'Searching…' : 'Search results'}</Text>
            </View>

            <Text style={styles.searchCount}>{search.state === 'found' ? matchCount(search.count) : UNKNOWN}</Text>
          </>
        )}
      </View>

      <View style={styles.totalsRow}>
        <View style={styles.totalCard}>
          <View style={styles.totalLabelRow}>
            <Icon name="income" size={11} color={colors.ok} strokeWidth={2.4} />
            <Text style={styles.totalLabel}>Income</Text>
          </View>

          <TotalValue value={income} isLoading={isLoading} currencyCode={currencyCode} />
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalLabelRow}>
            <Icon name="expense" size={11} color={colors.danger} strokeWidth={2.4} />
            <Text style={styles.totalLabel}>Expense</Text>
          </View>

          <TotalValue value={expense} isLoading={isLoading} currencyCode={currencyCode} />
        </View>
      </View>
    </View>
  );
};

export default FilterBar;
