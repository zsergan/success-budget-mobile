import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { Fab, RootLayout, SpaceSwitcher, useTransactionDelete, useTransactionFlow } from '@components';
import { getLoadState } from '@redux/api/loadState';
import { useAppSelector, useCurrentMonthArg, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { useGetWalletsQuery } from '@redux/state/wallet/api';
import { EMPTY_WALLETS, getTotalBalance } from '@redux/state/wallet/selectors';
import { useGetLatestTransactionQuery, useGetTransactionsQuery } from '@redux/state/transaction/api';
import { EMPTY_TRANSACTIONS, getEmptyPeriodState } from '@redux/state/transaction/selectors';
import { useBalanceVisibility } from '@hooks';
import { ScreenNames, TransactionType } from '@shared/enums';
import type { MainTabScreenProps } from '@shared/types';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';
import BalanceOverview from './components/BalanceOverview/BalanceOverview';
import RecentActivity from './components/RecentActivity/RecentActivity';
import WalletsSection from './components/WalletsSection/WalletsSection';

import styles from './style';

interface Props extends MainTabScreenProps<ScreenNames.HOME_TAB> {}

const HomeScreen = ({ navigation }: Props) => {
  const [focusedWalletId, setFocusedWalletId] = useState<number | undefined>(undefined);
  const { requestDelete } = useTransactionDelete();

  const spaceArg = useSpaceArg();
  const { currentData: walletsOverview } = useGetWalletsQuery(spaceArg);
  const { total, currencyCode, walletsCount, deltaPercent } = getTotalBalance(walletsOverview);
  const wallets = walletsOverview?.wallets ?? EMPTY_WALLETS;
  const recentArg = useCurrentMonthArg();
  const recentQuery = useGetTransactionsQuery(recentArg);
  const { openCreate, openDetails } = useTransactionFlow(
    recentArg === skipToken ? null : { from: recentArg.from, to: recentArg.to },
  );
  const { isLoading: isLoadingTransactions, hasError: hasTransactionsError } = getLoadState(recentQuery);
  // An empty month tells a first run from a quiet month only by the latest record of the whole history.
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const latestQuery = useGetLatestTransactionQuery(recentQuery.currentData?.length === 0 ? spaceArg : skipToken);
  const emptyState =
    recentArg === skipToken
      ? 'trueEmpty'
      : getEmptyPeriodState(latestQuery, { from: new Date(recentArg.from), to: new Date(recentArg.to) });
  const latest = latestQuery.currentData;
  const { isHidden, toggle } = useBalanceVisibility();

  // A wallet the user swiped to opens the form on it; otherwise the form picks the last used one.
  const composerWalletId = wallets.some(({ wallet }) => wallet.id === focusedWalletId) ? focusedWalletId : undefined;

  return (
    <>
      <RootLayout
        style={styles.container}
        contentContainerStyle={{ paddingBottom: FAB_SCROLL_CLEARANCE }}
        edges={['top', 'left', 'right']}
        scrollable
        blurredStatusBar
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

        <RecentActivity
          navigation={navigation}
          transactions={recentQuery.currentData ?? EMPTY_TRANSACTIONS}
          currencyCode={currencyCode}
          hasWallets={wallets.length > 0}
          isLoading={isLoadingTransactions}
          hasError={hasTransactionsError}
          onRetry={recentQuery.refetch}
          emptyState={emptyState}
          latest={latest ?? null}
          onRetryLatest={latestQuery.refetch}
          onJumpToLatest={(transaction) =>
            spaceId !== null &&
            navigation.navigate(ScreenNames.TRANSACTIONS_TAB, {
              reveal: { spaceId, transactionId: transaction.id, timestamp: transaction.timestamp },
            })
          }
          onPressTransaction={openDetails}
          onDeleteTransaction={requestDelete}
        />
      </RootLayout>

      <Fab
        onExpense={() => openCreate(TransactionType.EXPENSE, composerWalletId)}
        onIncome={() => openCreate(TransactionType.INCOME, composerWalletId)}
      />
    </>
  );
};

export default HomeScreen;
