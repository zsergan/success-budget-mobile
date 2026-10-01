import { useRef, useState } from 'react';
import { View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';

import type { TransactionComposerHandle } from '@components';
import { BottomSheetModal as BottomModal, RangePickerSheet, ScreenFrame, TransactionComposer } from '@components';
import { usePeriod } from '@hooks';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { useGetWalletsQuery } from '@redux/state/wallet/api';
import { ScreenNames } from '@shared/enums';
import type { MainTabNavigationProp } from '@shared/types';
import { formatRangeLabel, hasComparison, isCurrentMonth, monthPeriodOf } from '@shared/utils';
import CreateWalletSheet from './components/CreateWalletSheet/CreateWalletSheet';
import StatsEmptyState from './components/StatsEmptyState/StatsEmptyState';
import StatsFailure from './components/StatsFailure/StatsFailure';
import StatsHeader from './components/StatsHeader/StatsHeader';
import StatsList from './components/StatsList/StatsList';
import UpdateFailedToast from './components/UpdateFailedToast/UpdateFailedToast';
import { UPDATE_TOAST_SPACE } from './components/UpdateFailedToast/style';
import { parseDateKey } from './format';
import { toHistoryFilter } from './historyFilter';
import useAddTransaction from './hooks/useAddTransaction';
import useComposeWithNewWallet from './hooks/useComposeWithNewWallet';
import useRefreshOnReturn from './hooks/useRefreshOnReturn';
import useSpaceAccessRecovery from './hooks/useSpaceAccessRecovery';
import useStatsData from './hooks/useStatsData';
import useStatsSelection from './hooks/useStatsSelection';
import type { BreakdownGroup, BreakdownMode } from './statsItems';
import { buildStatsItems } from './statsItems';
import { getStatsViewState } from './statsViewState';
import styles from './style';

const StatsScreen = () => {
  const navigation = useNavigation<MainTabNavigationProp<ScreenNames.STATS_TAB>>();
  const rangePickerRef = useRef<BottomSheetModal>(null);
  const walletSheetRef = useRef<BottomSheetModal>(null);
  const composerRef = useRef<TransactionComposerHandle>(null);

  const { period, range, canReset, applyPeriod, selectCurrent, resetPeriod } = usePeriod();
  const { summary, trend, breakdown, refreshIfStale, updateFailed, retryFailed, loadFailed, loadError, accessDenied } =
    useStatsData(range);
  useRefreshOnReturn(refreshIfStale);
  useSpaceAccessRecovery(accessDenied);

  const { currentData: walletsOverview } = useGetWalletsQuery(useSpaceArg());
  const firstWalletId = walletsOverview?.wallets[0]?.wallet.id ?? -1;

  const spaceId = useAppSelector(selectCurrentSpaceId);

  const addTransaction = useAddTransaction({
    onHasWallets: () => composerRef.current?.openExpense(),
    onNoWallets: () => walletSheetRef.current?.present(),
  });

  const openCreateWallet = () => {
    if (spaceId === null) return;

    navigation.navigate(ScreenNames.ADD_WALLET_SCREEN, {
      id: 'new',
      addTransaction: { returnTo: ScreenNames.STATS_TAB, spaceId },
    });
  };

  useComposeWithNewWallet((walletId) => composerRef.current?.openExpense(walletId));

  const [mode, setMode] = useState<BreakdownMode>('category');
  const selection = useStatsSelection(JSON.stringify([spaceId, range.from, range.to]), mode);

  const failure = accessDenied ? (
    <StatsFailure variant="noAccess" error={loadError} onOpenHome={() => navigation.navigate(ScreenNames.HOME_TAB)} />
  ) : loadFailed ? (
    <StatsFailure variant="loadFailed" error={loadError} onRetry={retryFailed} />
  ) : null;

  const showsUpdateFailed = updateFailed && !failure;

  const viewState = getStatsViewState(summary.data);
  const showsBlocks = !failure && (viewState === 'data' || viewState === 'pending');
  const items = showsBlocks
    ? buildStatsItems({ breakdown: breakdown.data, mode, isOtherExpanded: selection.isOtherExpanded })
    : [];

  // A pick that a refresh took away from the breakdown is simply not shown.
  const donut = items.find((item) => item.kind === 'donut');
  const selectedSegmentKey =
    donut && donut.groups.some((group) => group.key === selection.selectedSegmentKey)
      ? selection.selectedSegmentKey
      : null;

  const openHistory = (group: BreakdownGroup) => {
    const filter = breakdown.data && spaceId !== null && toHistoryFilter(group, breakdown.data.period, spaceId);
    if (filter) navigation.navigate(ScreenNames.TRANSACTIONS_TAB, { filter });
  };

  const monthLabel = range.from.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const lastTransactionDate = summary.data?.last_transaction_date;

  const placeholder = failure ? (
    failure
  ) : viewState === 'noHistory' ? (
    <StatsEmptyState variant="noHistory" onAddTransaction={addTransaction} />
  ) : viewState === 'future' ? (
    <StatsEmptyState variant="future" rangeLabel={formatRangeLabel(range)} onReset={resetPeriod} />
  ) : viewState === 'emptyPeriod' && lastTransactionDate ? (
    <StatsEmptyState
      variant="emptyPeriod"
      rangeLabel={isCurrentMonth(period) ? monthLabel : formatRangeLabel(range)}
      isCurrentMonth={isCurrentMonth(period)}
      lastTransactionDate={lastTransactionDate}
      onReset={canReset ? resetPeriod : undefined}
      onOpenLastMonth={() => applyPeriod(monthPeriodOf(parseDateKey(lastTransactionDate)))}
    />
  ) : null;

  return (
    <>
      <TransactionComposer ref={composerRef} initialWalletId={firstWalletId} />

      <BottomModal ref={rangePickerRef} dynamicSizing>
        <RangePickerSheet period={period} onApply={applyPeriod} />
      </BottomModal>

      <BottomModal ref={walletSheetRef} dynamicSizing>
        <CreateWalletSheet onCreateWallet={openCreateWallet} />
      </BottomModal>

      <ScreenFrame edges={['top', 'left', 'right']}>
        <View style={styles.root} onTouchStart={selection.handleScreenTouch}>
          <StatsHeader
            period={period}
            onPresetPress={selectCurrent}
            onOpenPicker={() => rangePickerRef.current?.present()}
            onReset={resetPeriod}
          />

          <StatsList
            items={items}
            summary={summary}
            trend={trend}
            breakdown={breakdown}
            selectedTrendKey={selection.selectedTrendKey}
            onSelectTrend={selection.selectTrend}
            onTrendTouch={selection.markTrendTouch}
            showComparison={hasComparison(period)}
            placeholder={placeholder}
            mode={mode}
            selectedSegmentKey={selectedSegmentKey}
            onSelectSegment={selection.selectSegment}
            onDonutTouch={selection.markDonutTouch}
            isOtherExpanded={selection.isOtherExpanded}
            onModeChange={setMode}
            onToggleOther={selection.toggleOther}
            onOpenHistory={openHistory}
            bottomSpace={showsUpdateFailed ? UPDATE_TOAST_SPACE : undefined}
          />

          {showsUpdateFailed && <UpdateFailedToast onRetry={retryFailed} />}
        </View>
      </ScreenFrame>
    </>
  );
};

export default StatsScreen;
