import { useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import type { TransactionComposerHandle } from '@components';
import { BottomSheetModal as BottomModal, RangePickerSheet, ScreenFrame, TransactionComposer } from '@components';
import { usePeriod } from '@hooks';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import { useGetWalletsQuery } from '@redux/state/wallet/api';
import { formatRangeLabel, hasComparison, isCurrentMonth, monthPeriodOf } from '@shared/utils';
import StatsEmptyState from './components/StatsEmptyState/StatsEmptyState';
import StatsHeader from './components/StatsHeader/StatsHeader';
import StatsList from './components/StatsList/StatsList';
import { parseDateKey } from './format';
import useRefreshOnReturn from './hooks/useRefreshOnReturn';
import useStatsData from './hooks/useStatsData';
import type { BreakdownMode } from './statsItems';
import { buildStatsItems } from './statsItems';
import { getStatsViewState } from './statsViewState';

const StatsScreen = () => {
  const rangePickerRef = useRef<BottomSheetModal>(null);
  const composerRef = useRef<TransactionComposerHandle>(null);

  const { period, range, canReset, applyPeriod, selectCurrent, resetPeriod } = usePeriod();
  const { summary, breakdown, refreshIfStale } = useStatsData(range);
  useRefreshOnReturn(refreshIfStale);

  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const { currentData: walletsOverview } = useGetWalletsQuery(useSpaceArg());
  const firstWalletId = walletsOverview?.wallets[0]?.wallet.id ?? -1;

  const spaceId = useAppSelector(selectCurrentSpaceId);
  const [mode, setMode] = useState<BreakdownMode>('category');

  // Other stays expanded only for the breakdown it was opened in.
  const breakdownScope = JSON.stringify([spaceId, range.from, range.to, mode]);
  const [expandedIn, setExpandedIn] = useState<string | null>(null);
  const isOtherExpanded = expandedIn === breakdownScope;

  const viewState = getStatsViewState(summary.data);
  const showsBlocks = viewState === 'data' || viewState === 'pending';
  const items = showsBlocks ? buildStatsItems({ breakdown: breakdown.data, mode, isOtherExpanded }) : [];

  const monthLabel = range.from.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const lastTransactionDate = summary.data?.last_transaction_date;

  const placeholder =
    viewState === 'noHistory' ? (
      <StatsEmptyState variant="noHistory" onAddTransaction={() => composerRef.current?.openExpense()} />
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

      <ScreenFrame edges={['top', 'left', 'right']}>
        <StatsHeader
          period={period}
          onPresetPress={selectCurrent}
          onOpenPicker={() => rangePickerRef.current?.present()}
          onReset={resetPeriod}
        />

        <StatsList
          items={items}
          summary={summary}
          showComparison={hasComparison(period)}
          placeholder={placeholder}
          currencyCode={currencyCode}
          mode={mode}
          isOtherExpanded={isOtherExpanded}
          onModeChange={setMode}
          onToggleOther={() => setExpandedIn(isOtherExpanded ? null : breakdownScope)}
        />
      </ScreenFrame>
    </>
  );
};

export default StatsScreen;
