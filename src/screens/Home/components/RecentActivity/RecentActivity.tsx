import { Text, View } from 'react-native';

import { EmptyState, SectionTitle, TinyButton, TransactionCard } from '@components';
import type { TransactionModel } from '@api/models';
import type { NavigationType } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { formatNumber, groupTransactionsByDay } from '@shared/utils';

import styles from './style';

const RECENT_TRANSACTIONS_LIMIT = 5;

interface Props {
  navigation: NavigationType<ScreenNames.HOME_TAB>;
  transactions: TransactionModel[];
  currencyCode?: string;
  hasWallets: boolean;
}

const RecentActivity = ({ navigation, transactions, currencyCode, hasWallets }: Props) => {
  const groups = groupTransactionsByDay(transactions.slice(0, RECENT_TRANSACTIONS_LIMIT), currencyCode);

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
        {transactions.length === 0 ? (
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
              <View key={group.label}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupLabel}>{group.label}</Text>

                  {group.total !== undefined && (
                    <Text style={styles.groupTotal}>
                      {`${group.total >= 0 ? '+' : '-'}${formatNumber(Math.abs(group.total))}${
                        group.currencyCode ? ` ${group.currencyCode}` : ''
                      }`}
                    </Text>
                  )}
                </View>

                <View style={styles.groupItems}>
                  {group.items.map((transaction) => (
                    <TransactionCard key={transaction.id} transaction={transaction} currencyCode={currencyCode} />
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
