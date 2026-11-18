import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import type { StatisticsSummary } from '@api/dto';
import { Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { homeMoney, homeNet } from '@screens/Home/homeFigures';
import { toCents } from '@shared/utils';

import createStyles from './style';

interface Props {
  // "October".
  monthName: string;
  summary: StatisticsSummary | undefined;
  isLoading: boolean;
  hasError: boolean;
  currencyCode?: string;
  isHidden: boolean;
  onToggleHidden: () => void;
  onRetry: () => void;
}

// The month's income minus its expenses, from the server's totals of the whole month.
const MonthNet = ({
  monthName,
  summary,
  isLoading,
  hasError,
  currencyCode,
  isHidden,
  onToggleHidden,
  onRetry,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const net = summary ? toCents(summary.net) : 0;
  const tone = net > 0 ? colors.okText : net < 0 ? colors.dangerText : colors.text;
  const badge = net > 0 ? 'Surplus' : net < 0 ? 'Deficit' : 'Balanced';

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{`${monthName} net`}</Text>

        <TouchableOpacity
          onPress={onToggleHidden}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={isHidden ? 'Show amounts' : 'Hide amounts'}
        >
          <Icon name={isHidden ? 'eye-off' : 'eye'} size={16} color={colors.muted} />
        </TouchableOpacity>

        {summary && (
          <View style={[styles.badge, net > 0 ? styles.badgeOk : net < 0 ? styles.badgeDanger : styles.badgeNeutral]}>
            <Text style={[styles.badgeText, { color: net === 0 ? colors.muted : tone }]}>{badge}</Text>
          </View>
        )}
      </View>

      {summary ? (
        <>
          <Text style={[styles.net, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {homeNet(summary.net, currencyCode, isHidden)}
          </Text>

          <View style={styles.split}>
            <View style={styles.part}>
              <Text style={styles.partLabel}>Income</Text>
              <Text style={[styles.partValue, styles.income]} numberOfLines={1}>
                {homeMoney(summary.income.amount, currencyCode, isHidden)}
              </Text>
            </View>

            <View style={styles.part}>
              <Text style={styles.partLabel}>Expenses</Text>
              <Text style={styles.partValue} numberOfLines={1}>
                {homeMoney(summary.expense.amount, currencyCode, isHidden)}
              </Text>
            </View>
          </View>
        </>
      ) : isLoading ? (
        <View style={styles.placeholder}>
          <ActivityIndicator color={colors.muted} accessibilityLabel="Loading the month" />
        </View>
      ) : (
        hasError && (
          <View style={styles.placeholder}>
            <Text style={styles.error}>Couldn’t load this month’s totals.</Text>
            <TouchableOpacity onPress={onRetry} hitSlop={8} accessibilityRole="button">
              <Text style={styles.retry}>Retry</Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );
};

export default MonthNet;
