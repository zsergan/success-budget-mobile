import { useState } from 'react';

import { Fab, RootLayout, SpaceSwitcher, useTransactionDelete, useTransactionFlow } from '@components';
import { getLoadState } from '@redux/api/loadState';
import { useCurrentMonthArg, useSpaceArg } from '@redux/hooks';
import { useGetWalletsQuery } from '@redux/state/wallet/api';
import { EMPTY_WALLETS, getTotalBalance } from '@redux/state/wallet/selectors';
import { useGetTransactionsQuery } from '@redux/state/transaction/api';
import { EMPTY_TRANSACTIONS } from '@redux/state/transaction/selectors';
import { useBalanceVisibility } from '@hooks';
import type { ScreenNames } from '@shared/enums';
import { TransactionType } from '@shared/enums';
import type { MainTabScreenProps } from '@shared/types';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';
import BalanceOverview from './components/BalanceOverview/BalanceOverview';
import RecentActivity from './components/RecentActivity/RecentActivity';
import WalletsSection from './components/WalletsSection/WalletsSection';

import styles from './style';

interface Props extends MainTabScreenProps<ScreenNames.HOME_TAB> {}

const HomeScreen = ({ navigation }: Props) => {
  const [focusedWalletId, setFocusedWalletId] = useState<number | undefined>(undefined);
  const { openCreate, openDetails } = useTransactionFlow();
  const { requestDelete } = useTransactionDelete();

  const spaceArg = useSpaceArg();
  const { currentData: walletsOverview } = useGetWalletsQuery(spaceArg);
  const { total, currencyCode, walletsCount, deltaPercent } = getTotalBalance(walletsOverview);
  const wallets = walletsOverview?.wallets ?? EMPTY_WALLETS;
  const recentQuery = useGetTransactionsQuery(useCurrentMonthArg());
  const { isLoading: isLoadingTransactions, hasError: hasTransactionsError } = getLoadState(recentQuery);
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
