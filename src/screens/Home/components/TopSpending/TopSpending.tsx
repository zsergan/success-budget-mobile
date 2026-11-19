import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import type { StatisticsBreakdown } from '@api/dto';
import { toMobileIcon } from '@api/models';
import { CategoryIconBox, SectionTitle, TinyButton } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { HOME_TOP_CATEGORIES, homeMoney } from '@screens/Home/homeFigures';

import createStyles from './style';

interface Props {
  // The month's expense breakdown; the same cycle as the totals above it.
  breakdown: StatisticsBreakdown | undefined;
  isLoading: boolean;
  hasError: boolean;
  currencyCode?: string;
  isHidden: boolean;
  onSeeBreakdown: () => void;
  onRetry: () => void;
}

// The month's largest expense categories; the whole breakdown is in Stats.
const TopSpending = ({ breakdown, isLoading, hasError, currencyCode, isHidden, onSeeBreakdown, onRetry }: Props) => {
  const { colors, categories } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const rows = breakdown?.by_category.primary_items.slice(0, HOME_TOP_CATEGORIES) ?? [];
  const max = Math.max(...rows.map(({ amount }) => Number(amount)), 0);

  return (
    <>
      <SectionTitle
        style={styles.title}
        title="Top spending"
        button={rows.length > 0 && <TinyButton title="See breakdown" variant="plain" onPress={onSeeBreakdown} />}
      />

      {breakdown ? (
        rows.length === 0 ? (
          <Text style={styles.empty}>No expenses this month.</Text>
        ) : (
          <View style={styles.card}>
            {rows.map((row, index) => (
              <View key={row.key} style={[styles.row, index > 0 && styles.rowSeparated]}>
                <CategoryIconBox icon={toMobileIcon(row.icon)} color={row.color} size={34} />

                <View style={styles.body}>
                  <View style={styles.line}>
                    <Text style={styles.name} numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text style={styles.amount}>{homeMoney(row.amount, currencyCode, isHidden)}</Text>
                  </View>

                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        {
                          width: `${max > 0 ? (Number(row.amount) / max) * 100 : 0}%`,
                          backgroundColor: categories[row.color].stroke,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )
      ) : isLoading ? (
        <View style={styles.placeholder}>
          <ActivityIndicator color={colors.muted} accessibilityLabel="Loading top spending" />
        </View>
      ) : (
        hasError && (
          <View style={styles.placeholder}>
            <Text style={styles.empty}>Couldn’t load the breakdown.</Text>
            <TouchableOpacity onPress={onRetry} hitSlop={8} accessibilityRole="button">
              <Text style={styles.retry}>Retry</Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </>
  );
};

export default TopSpending;
