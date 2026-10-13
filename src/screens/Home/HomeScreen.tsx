import { useState } from 'react';
import { View } from 'react-native';

import {
  Banner,
  Fab,
  PendingWritesBanner,
  RootLayout,
  SpaceSwitcher,
  useTransactionDelete,
  useTransactionFlow,
} from '@components';
import { getLoadState } from '@redux/api/loadState';
import { useRecentArg, useSpaceArg } from '@redux/hooks';
import { useGetWalletsQuery } from '@redux/state/wallet/api';
import { EMPTY_WALLETS, getTotalBalance } from '@redux/state/wallet/selectors';
import { useGetRecentTransactionsQuery } from '@redux/state/transaction/api';
import { rangeSelection } from '@redux/state/transactionFlow/selection';
import { useBalanceVisibility, useSpaceRefresh } from '@hooks';
import type { ScreenNames } from '@shared/enums';
import { TransactionType } from '@shared/enums';
import type { MainTabScreenProps } from '@shared/types';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';
import { getCurrentMonthRange } from '@shared/utils';
import BalanceOverview from './components/BalanceOverview/BalanceOverview';
import RecentActivity from './components/RecentActivity/RecentActivity';
import WalletsSection from './components/WalletsSection/WalletsSection';

import styles from './style';

interface Props extends MainTabScreenProps<ScreenNames.HOME_TAB> {}

const HomeScreen = ({ navigation }: Props) => {
  useSpaceRefresh();
  const [focusedWalletId, setFocusedWalletId] = useState<number | undefined>(undefined);
  const { requestDelete } = useTransactionDelete();

  const spaceArg = useSpaceArg();
  const walletsQuery = useGetWalletsQuery(spaceArg);
  const walletsOverview = walletsQuery.currentData;
  const { total, currencyCode, walletsCount, deltaPercent } = getTotalBalance(walletsOverview);
  const wallets = walletsOverview?.wallets ?? EMPTY_WALLETS;
  const recentQuery = useGetRecentTransactionsQuery(useRecentArg());
  // A record saved outside this month is unlikely to be among the latest few, so the confirmation offers to show it.
  const { openCreate, openDetails } = useTransactionFlow(rangeSelection(getCurrentMonthRange()));
  const {
    isLoading: isLoadingTransactions,
    hasError: hasTransactionsError,
    hasRefreshError: hasRecentRefreshError,
  } = getLoadState(recentQuery);
  // Balances and activity stay, but a refresh, e.g. after a saved change, could not bring them up to date.
  const refreshFailed = hasRecentRefreshError || getLoadState(walletsQuery).hasRefreshError;
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

        {refreshFailed && (
          <View style={styles.banner}>
            <Banner
              tone="danger"
              text="Couldn’t update. Balances and activity show what was loaded before."
              actionLabel="Retry"
              onAction={() => {
                walletsQuery.refetch();
                recentQuery.refetch();
              }}
            />
          </View>
        )}

        <PendingWritesBanner style={styles.banner} />

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
          recent={recentQuery.currentData}
          currencyCode={currencyCode}
          hasWallets={wallets.length > 0}
          isLoading={isLoadingTransactions}
          hasError={hasTransactionsError}
          onRetry={recentQuery.refetch}
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
