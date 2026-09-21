import { useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Text, View } from 'react-native';

import {
  BottomSheetModal as BottomModal,
  EmptyState,
  Fab,
  RootLayout,
  SectionTitle,
  SpaceSwitcher,
  TinyButton,
  TransactionCard,
  TransactionForm,
} from '@components';
import { TRANSACTION_FORM_SNAP_POINT } from '@components/TransactionForm/TransactionForm';
import { useAppSelector } from '@redux/hooks';
import { selectTotalBalance, selectWallet } from '@redux/state/wallet/selectors';
import { selectTransaction } from '@redux/state/transaction/selectors';
import { useBalanceVisibility } from '@hooks';
import { ScreenNames, TransactionType } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';
import { formatNumber, groupTransactionsByDay } from '@shared/utils';
import BalanceOverview from './components/BalanceOverview/BalanceOverview';
import WalletsSection from './components/WalletsSection/WalletsSection';

import styles from './style';

const RECENT_TRANSACTIONS_LIMIT = 5;

interface Props extends ScreenProps<ScreenNames.HOME_TAB> {}

const HomeScreen = ({ navigation }: Props) => {
  const [focusedWalletId, setFocusedWalletId] = useState<number | undefined>(undefined);

  const expenseBottomSheetRef = useRef<BottomSheetModal>(null);
  const incomeBottomSheetRef = useRef<BottomSheetModal>(null);

  const handlePresentExpenseModalPress = () => expenseBottomSheetRef.current?.present();
  const handlePresentIncomeModalPress = () => incomeBottomSheetRef.current?.present();

  const { total, currencyCode, walletsCount, deltaPercent } = useAppSelector(selectTotalBalance);
  const { wallets } = useAppSelector(selectWallet);
  const { transactions } = useAppSelector(selectTransaction);
  const { isHidden, toggle } = useBalanceVisibility();

  const hasWallets = wallets.length > 0;

  const recentGroups = groupTransactionsByDay(transactions.slice(0, RECENT_TRANSACTIONS_LIMIT), currencyCode);

  // The focused wallet can disappear (deleted, or a space switch replaced the list), so fall back to the first one.
  const composerWalletId =
    focusedWalletId !== undefined && wallets.some(({ wallet }) => wallet.id === focusedWalletId)
      ? focusedWalletId
      : (wallets[0]?.wallet.id ?? -1);

  return (
    <>
      <BottomModal ref={expenseBottomSheetRef} snapPoint={TRANSACTION_FORM_SNAP_POINT}>
        <TransactionForm initialWalletId={composerWalletId} />
      </BottomModal>

      <BottomModal ref={incomeBottomSheetRef} snapPoint={TRANSACTION_FORM_SNAP_POINT}>
        <TransactionForm initialWalletId={composerWalletId} transactionType={TransactionType.INCOME} />
      </BottomModal>

      <RootLayout
        style={styles.container}
        contentContainerStyle={{ paddingBottom: FAB_SCROLL_CLEARANCE }}
        edges={['top', 'left', 'right']}
        scrollable
      >
        <SpaceSwitcher navigation={navigation} />

        <BalanceOverview
          total={total}
          currencyCode={currencyCode}
          walletsCount={walletsCount}
          deltaPercent={deltaPercent}
          isHidden={isHidden}
          onToggleVisibility={toggle}
        />

        <WalletsSection navigation={navigation} onFocusedWalletChange={setFocusedWalletId} />

        <SectionTitle
          style={styles.activityTitle}
          title="Recent activity"
          button={
            <TinyButton
              title="See all"
              variant="plain"
              onPress={() => navigation.navigate(ScreenNames.TRANSACTIONS_TAB)}
            />
          }
        />

        <View style={styles.activitySection}>
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
              {recentGroups.map((group) => (
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
      </RootLayout>

      <Fab onExpense={handlePresentExpenseModalPress} onIncome={handlePresentIncomeModalPress} />
    </>
  );
};

export default HomeScreen;
