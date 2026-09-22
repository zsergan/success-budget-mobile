import { useRef, useState } from 'react';

import type { TransactionComposerHandle } from '@components';
import { Fab, RootLayout, SpaceSwitcher, TransactionComposer } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectTotalBalance, selectWallet } from '@redux/state/wallet/selectors';
import { selectTransaction } from '@redux/state/transaction/selectors';
import { fetchTransactions } from '@redux/state/transaction/thunks';
import { useBalanceVisibility } from '@hooks';
import type { ScreenNames } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';
import BalanceOverview from './components/BalanceOverview/BalanceOverview';
import RecentActivity from './components/RecentActivity/RecentActivity';
import WalletsSection from './components/WalletsSection/WalletsSection';

import styles from './style';

interface Props extends ScreenProps<ScreenNames.HOME_TAB> {}

const HomeScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const [focusedWalletId, setFocusedWalletId] = useState<number | undefined>(undefined);
  const composerRef = useRef<TransactionComposerHandle>(null);

  const { total, currencyCode, walletsCount, deltaPercent } = useAppSelector(selectTotalBalance);
  const { wallets } = useAppSelector(selectWallet);
  const {
    transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
  } = useAppSelector(selectTransaction);
  const { isHidden, toggle } = useBalanceVisibility();

  // The focused wallet can disappear (deleted, or a space switch replaced the list), so fall back to the first one.
  const composerWalletId =
    focusedWalletId !== undefined && wallets.some(({ wallet }) => wallet.id === focusedWalletId)
      ? focusedWalletId
      : (wallets[0]?.wallet.id ?? -1);

  return (
    <>
      <TransactionComposer ref={composerRef} initialWalletId={composerWalletId} />

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

        <RecentActivity
          navigation={navigation}
          transactions={transactions}
          currencyCode={currencyCode}
          hasWallets={wallets.length > 0}
          isLoading={isLoadingTransactions}
          error={transactionsError}
          onRetry={() => dispatch(fetchTransactions())}
        />
      </RootLayout>

      <Fab onExpense={() => composerRef.current?.openExpense()} onIncome={() => composerRef.current?.openIncome()} />
    </>
  );
};

export default HomeScreen;
