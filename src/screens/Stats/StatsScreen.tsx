import { useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import { BottomSheetModal as BottomModal, RangePickerSheet, ScreenFrame } from '@components';
import { usePeriod } from '@hooks';
import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import StatsHeader from './components/StatsHeader/StatsHeader';
import StatsList from './components/StatsList/StatsList';
import useRefreshOnReturn from './hooks/useRefreshOnReturn';
import useStatsData from './hooks/useStatsData';
import type { BreakdownMode } from './statsItems';
import { buildStatsItems } from './statsItems';

const StatsScreen = () => {
  const rangePickerRef = useRef<BottomSheetModal>(null);

  const { period, range, applyPeriod, selectCurrent, resetPeriod } = usePeriod();
  const { breakdown, refreshIfStale } = useStatsData(range);
  useRefreshOnReturn(refreshIfStale);

  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  const spaceId = useAppSelector(selectCurrentSpaceId);
  const [mode, setMode] = useState<BreakdownMode>('category');

  // Other stays expanded only for the breakdown it was opened in.
  const breakdownScope = JSON.stringify([spaceId, range.from, range.to, mode]);
  const [expandedIn, setExpandedIn] = useState<string | null>(null);
  const isOtherExpanded = expandedIn === breakdownScope;

  const items = buildStatsItems({ breakdown: breakdown.data, mode, isOtherExpanded });

  return (
    <>
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
