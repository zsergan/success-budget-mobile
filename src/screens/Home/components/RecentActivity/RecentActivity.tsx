import { ActivityIndicator, Text, View } from 'react-native';

import { EmptyState, SectionTitle, TinyButton, TransactionCard } from '@components';
import type { TransactionModel } from '@api/models';
import type { MainTabNavigationProp } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { colors } from '@shared/theme';
import { formatSignedAmount, groupTransactionsByDay, limitGroupRows } from '@shared/utils';

import styles from './style';

const RECENT_TRANSACTIONS_LIMIT = 5;

interface Props {
  navigation: MainTabNavigationProp<ScreenNames.HOME_TAB>;
  transactions: TransactionModel[];
  currencyCode?: string;
  hasWallets: boolean;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  onPressTransaction: (transaction: TransactionModel) => void;
  onDeleteTransaction: (transaction: TransactionModel, onSettled: () => void) => void;
}

const RecentActivity = ({
  navigation,
  transactions,
  currencyCode,
  hasWallets,
  isLoading,
  hasError,
  onRetry,
  onPressTransaction,
  onDeleteTransaction,
}: Props) => {
  // `transactions` is the whole current month, so every day's total covers all of it, not only the rows shown.
  const groups = limitGroupRows(groupTransactionsByDay(transactions), RECENT_TRANSACTIONS_LIMIT);

  return (
    <>
      <SectionTitle
        style={styles.title}
        title="Recent activity"
        button={
          <TinyButton
            title="See all"
            variant="plain"
            onPress={() => navigation.navigate(ScreenNames.TRANSACTIONS_TAB)}
          />
        }
      />

      <View style={styles.section}>
        {isLoading && transactions.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : !isLoading && hasError && transactions.length === 0 ? (
          <EmptyState
            icon="list"
            title="Couldn't load recent activity"
            description="Check your connection and try again."
            actionLabel="Retry"
            onActionPress={onRetry}
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="list"
            title="Nothing here yet"
            description={
              hasWallets
                ? 'Tap + to record your first income or expense.'
                : 'Transactions will appear here once you add a wallet.'
            }
          />
        ) : (
          <View style={styles.activity}>
            {groups.map((group) => (
              <View key={group.key}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupLabel}>{group.label}</Text>

                  <Text style={[styles.groupTotal, group.total > 0 && styles.groupTotalPositive]}>
                    {formatSignedAmount(group.total, currencyCode)}
                  </Text>
                </View>

                <View style={styles.groupItems}>
                  {group.items.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      currencyCode={currencyCode}
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
