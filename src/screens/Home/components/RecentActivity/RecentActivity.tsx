import { ActivityIndicator, Text, View } from 'react-native';

import type { TransactionFeedPageModel, TransactionModel } from '@api/models';
import { EmptyState, SectionTitle, TinyButton, TransactionCard } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { formatSignedAmount, groupRowsByDay, toCents } from '@shared/utils';

import createStyles from './style';

interface Props {
  // The newest records of the month shown, with their days' server totals; undefined until loaded.
  recent?: TransactionFeedPageModel;
  currencyCode?: string;
  isHidden: boolean;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  onViewAll: () => void;
  onPressTransaction: (transaction: TransactionModel) => void;
  onDeleteTransaction: (transaction: TransactionModel, onSettled: () => void) => void;
}

// The latest few records of the month; all of them are in History, for the same month.
const RecentActivity = ({
  recent,
  currencyCode,
  isHidden,
  isLoading,
  hasError,
  onRetry,
  onViewAll,
  onPressTransaction,
  onDeleteTransaction,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const transactions = recent?.items ?? [];
  const groups = groupRowsByDay(transactions);
  const dayNets = Object.fromEntries((recent?.dayTotals ?? []).map(({ date, net }) => [date, net]));

  return (
    <>
      <SectionTitle
        style={styles.title}
        title="Activity"
        button={<TinyButton title="View all" variant="plain" onPress={onViewAll} />}
      />

      <View style={styles.section}>
        {isLoading && transactions.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : !isLoading && hasError && transactions.length === 0 ? (
          <EmptyState
            icon="list"
            title="Couldn't load activity"
            description="Check your connection and try again."
            actionLabel="Retry"
            onActionPress={onRetry}
          />
        ) : transactions.length === 0 ? (
          <Text style={styles.empty}>No transactions this month.</Text>
        ) : (
          <View style={styles.activity}>
            {groups.map((group) => (
              <View key={group.key}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupLabel}>{group.label}</Text>

                  {dayNets[group.key] !== undefined && !isHidden && (
                    <Text style={[styles.groupTotal, toCents(dayNets[group.key]) > 0 && styles.groupTotalPositive]}>
                      {formatSignedAmount(dayNets[group.key], currencyCode)}
                    </Text>
                  )}
                </View>

                <View style={styles.groupItems}>
                  {group.items.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      currencyCode={currencyCode}
                      isAmountHidden={isHidden}
                      onPress={onPressTransaction}
                      onDelete={onDeleteTransaction}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );
};

export default RecentActivity;
