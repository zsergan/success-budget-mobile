import { useEffect, useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Text, TouchableOpacity, View } from 'react-native';

import {
  BottomSheetModal as BottomModal,
  EmptyState,
  Fab,
  Icon,
  RootLayout,
  SectionTitle,
  TinyButton,
  TransactionCard,
  TransactionForm,
} from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectTotalBalance, selectWallet } from '@redux/state/wallet/selectors';
import { selectTransaction } from '@redux/state/transaction/selectors';
import { fetchTransactions } from '@redux/state/transaction/thunks';
import { useBalanceVisibility } from '@hooks';
import { ScreenNames, TransactionType } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { colors } from '@shared/theme';
import { formatNumber, groupTransactionsByDay } from '@shared/utils';
import Wallets from './Wallets/Wallets';

import styles from './style';

const RECENT_TRANSACTIONS_LIMIT = 5;

interface Props extends ScreenProps<ScreenNames.HOME_TAB> {}

const HomeScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const [currentWalletIndex, setCurrentWalletIndex] = useState<number>(0);

  const expenseBottomSheetRef = useRef<BottomSheetModal>(null);
  const incomeBottomSheetRef = useRef<BottomSheetModal>(null);

  const handlePresentExpenseModalPress = () => expenseBottomSheetRef.current?.present();
  const handlePresentIncomeModalPress = () => incomeBottomSheetRef.current?.present();

  const { total, currencyCode, walletsCount, deltaPercent } = useAppSelector(selectTotalBalance);
  const { wallets } = useAppSelector(selectWallet);
  const { transactions } = useAppSelector(selectTransaction);
  const { isHidden, toggle } = useBalanceVisibility();

  const hasWallets = wallets.length > 0;
  const deltaPositive = deltaPercent > 0;
  const deltaNeutral = deltaPercent === 0;
  const deltaFg = deltaNeutral ? colors.muted : deltaPositive ? colors.ok : colors.danger;
  const deltaBg = deltaNeutral ? colors.track : `${deltaFg}26`;

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const recentGroups = groupTransactionsByDay(transactions.slice(0, RECENT_TRANSACTIONS_LIMIT), currencyCode);

  return (
    <>
      <BottomModal ref={expenseBottomSheetRef}>
        <TransactionForm initialWalletIndex={currentWalletIndex} />
      </BottomModal>

      <BottomModal ref={incomeBottomSheetRef}>
        <TransactionForm initialWalletIndex={currentWalletIndex} transactionType={TransactionType.INCOME} />
      </BottomModal>

      <RootLayout style={styles.container} scrollable>
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroInfo}>
              <View style={styles.heroLabelRow}>
                <Text style={styles.heroLabel}>Total balance</Text>

                <TouchableOpacity onPress={toggle} hitSlop={8}>
                  <Icon name={isHidden ? 'eye-off' : 'eye'} size={15} color={colors.muted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.heroTotal}>
                {isHidden
                  ? `••• •••${currencyCode ? ` ${currencyCode}` : ''}`
                  : `${formatNumber(total)}${currencyCode ? ` ${currencyCode}` : ''}`}
              </Text>

              {currencyCode && (
                <Text
                  style={styles.heroSub}
                >{`${walletsCount} wallet${walletsCount === 1 ? '' : 's'} · ${currencyCode}`}</Text>
              )}
            </View>

            {currencyCode && (
              <View style={[styles.deltaBadge, { backgroundColor: deltaBg }]}>
                {!deltaNeutral && (
                  <Icon name={deltaPositive ? 'trend-up' : 'trend-down'} size={11} color={deltaFg} strokeWidth={2.3} />
                )}

                <Text style={[styles.deltaText, { color: deltaFg }]}>{`${Math.abs(deltaPercent).toFixed(1)}%`}</Text>
              </View>
            )}
          </View>
        </View>

        <SectionTitle
          style={styles.walletsTitle}
          title="Your wallets"
          button={
            <TinyButton
              title="Add Wallet"
              icon="plus"
              iconWrap={false}
              strokeWidth={2.2}
              onPress={() => navigation.navigate(ScreenNames.ADD_WALLET_SCREEN, { id: 'new' })}
            />
          }
        />

        <View style={styles.walletsSection}>
          <Wallets navigation={navigation} onScrollEnd={(index: number) => setCurrentWalletIndex(index)} />
        </View>

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
                      <TransactionCard key={transaction.id} transaction={transaction} />
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
