import { useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import { BottomSheetModal as BottomModal, Fab, RootLayout, SpaceSwitcher, TransactionForm } from '@components';
import { TRANSACTION_FORM_SNAP_POINT } from '@components/TransactionForm/TransactionForm';
import { useAppSelector } from '@redux/hooks';
import { selectTotalBalance, selectWallet } from '@redux/state/wallet/selectors';
import { selectTransaction } from '@redux/state/transaction/selectors';
import { useBalanceVisibility } from '@hooks';
import type { ScreenNames } from '@shared/enums';
import { TransactionType } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';
import BalanceOverview from './components/BalanceOverview/BalanceOverview';
import RecentActivity from './components/RecentActivity/RecentActivity';
import WalletsSection from './components/WalletsSection/WalletsSection';

import styles from './style';

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

        <RecentActivity
          navigation={navigation}
          transactions={transactions}
          currencyCode={currencyCode}
          hasWallets={wallets.length > 0}
        />
      </RootLayout>

      <Fab onExpense={handlePresentExpenseModalPress} onIncome={handlePresentIncomeModalPress} />
    </>
  );
};

export default HomeScreen;
