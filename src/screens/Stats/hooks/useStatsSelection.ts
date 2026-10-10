import { useRef, useState } from 'react';

import type { BreakdownMode } from '@screens/Stats/statsItems';
import { TransactionType } from '@shared/enums';

interface Selection {
  scope: string;
  trendKey: string | null;
  segmentKey: string | null;
  // Other's state per breakdown type and grouping.
  expanded: Partial<Record<`${TransactionType}:${BreakdownMode}`, boolean>>;
}

const initial = (scope: string): Selection => ({ scope, trendKey: null, segmentKey: null, expanded: {} });

// What the user picked on the charts and opened in the list. It belongs to one space and period:
// a new scope starts clean, while leaving the screen and coming back keeps it. The breakdown's type
// and grouping outlive a scope; changing either drops the segment, so a pick never carries over to a
// same-keyed group of the other breakdown.
const useStatsSelection = (scope: string) => {
  const [breakdownType, setBreakdownType] = useState(TransactionType.EXPENSE);
  const [mode, setMode] = useState<BreakdownMode>('category');
  const [stored, setStored] = useState<Selection>(() => initial(scope));
  const current = stored.scope === scope ? stored : initial(scope);
  const view = `${breakdownType}:${mode}` as const;

  const update = (change: (selection: Selection) => Partial<Selection>) =>
    setStored((prev) => {
      const base = prev.scope === scope ? prev : initial(scope);

      return { ...base, ...change(base) };
    });

  // Each chart flags its own touches before the screen sees them; any other touch drops that chart's pick.
  const touchedRef = useRef({ trend: false, donut: false });

  const handleScreenTouch = () => {
    const touched = touchedRef.current;
    const dropTrend = !touched.trend && current.trendKey !== null;
    const dropSegment = !touched.donut && current.segmentKey !== null;
    touchedRef.current = { trend: false, donut: false };

    if (dropTrend || dropSegment) {
      update((selection) => ({
        trendKey: dropTrend ? null : selection.trendKey,
        segmentKey: dropSegment ? null : selection.segmentKey,
      }));
    }
  };

  return {
    breakdownType,
    mode,
    selectedTrendKey: current.trendKey,
    selectedSegmentKey: current.segmentKey,
    isOtherExpanded: !!current.expanded[view],
    changeBreakdownType: (type: TransactionType) => {
      if (type === breakdownType) return;
      setBreakdownType(type);
      update(() => ({ segmentKey: null }));
    },
    changeMode: (next: BreakdownMode) => {
      if (next === mode) return;
      setMode(next);
      update(() => ({ segmentKey: null }));
    },
    selectTrend: (key: string | null) => update(() => ({ trendKey: key })),
    selectSegment: (key: string | null) => update(() => ({ segmentKey: key })),
    toggleOther: () =>
      update((selection) => ({ expanded: { ...selection.expanded, [view]: !selection.expanded[view] } })),
    markTrendTouch: () => {
      touchedRef.current.trend = true;
    },
    markDonutTouch: () => {
      touchedRef.current.donut = true;
    },
    handleScreenTouch,
  };
};

export default useStatsSelection;
