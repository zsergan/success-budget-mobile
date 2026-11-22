import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import type { TransactionFeedPageModel, TransactionModel } from '@api/models';
import { EmptyState, Icon, SectionTitle, TransactionCard } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { RECENT_TRANSACTIONS_LIMIT } from '@redux/state/transaction/api';

import createStyles from './style';

interface Props {
  // The newest records of the month shown, newest first; undefined until loaded.
  recent?: TransactionFeedPageModel;
  // The month shown, with its year when that is not the current one: "November" or "November 2025".
  monthLabel: string;
  currencyCode?: string;
  isHidden: boolean;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  onViewAll: () => void;
  onPressTransaction: (transaction: TransactionModel) => void;
  onDeleteTransaction: (transaction: TransactionModel, onSettled: () => void) => void;
}

// A preview of the month's latest records, each with its own day; the whole month is in History, however few are here.
const RecentTransactions = ({
  recent,
  monthLabel,
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
  const transactions = (recent?.items ?? []).slice(0, RECENT_TRANSACTIONS_LIMIT);
  const historyLabel = `All transactions for ${monthLabel}`;

  return (
    <>
      <SectionTitle
        style={styles.title}
        title="Recent transactions"
        subtitle={`Latest transactions in ${monthLabel}`}
      />

      <View style={styles.section}>
        {isLoading && transactions.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.accent} accessibilityLabel="Loading recent transactions" />
          </View>
        ) : !isLoading && hasError && transactions.length === 0 ? (
          <EmptyState
            icon="list"
            title="Couldn't load recent transactions"
            description="Check your connection and try again."
            actionLabel="Retry"
            onActionPress={onRetry}
          />
        ) : transactions.length === 0 ? (
          <Text style={styles.empty}>{`No transactions in ${monthLabel}.`}</Text>
        ) : (
          <View style={styles.rows}>
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                currencyCode={currencyCode}
                isAmountHidden={isHidden}
                showsDay
                onPress={onPressTransaction}
                onDelete={onDeleteTransaction}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.history}
          onPress={onViewAll}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={historyLabel}
        >
          <Text style={styles.historyText}>{historyLabel}</Text>
          <Icon name="arrow-right" size={16} color={colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>
    </>
  );
};

export default RecentTransactions;
