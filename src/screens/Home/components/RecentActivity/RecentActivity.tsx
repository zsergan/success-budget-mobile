import { ActivityIndicator, Text, View } from 'react-native';

import { EmptyState, SectionTitle, TinyButton, TransactionCard } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import type { TransactionFeedPageModel, TransactionModel } from '@api/models';
import type { MainTabNavigationProp } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { formatSignedAmount, groupRowsByDay, toCents } from '@shared/utils';

import createStyles from './style';

interface Props {
  navigation: MainTabNavigationProp<ScreenNames.HOME_TAB>;
  // The latest records of the whole history with their days' server totals; undefined until loaded.
  recent?: TransactionFeedPageModel;
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
  recent,
  currencyCode,
  hasWallets,
  isLoading,
  hasError,
  onRetry,
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

                  {dayNets[group.key] !== undefined && (
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
