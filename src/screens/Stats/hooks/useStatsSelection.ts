import { useRef, useState } from 'react';

import type { BreakdownMode } from '@screens/Stats/statsItems';

interface Selection {
  scope: string;
  trendKey: string | null;
  segment: { mode: BreakdownMode; key: string } | null;
  expanded: Record<BreakdownMode, boolean>;
}

const initial = (scope: string): Selection => ({
  scope,
  trendKey: null,
  segment: null,
  expanded: { category: false, wallet: false },
});

// What the user picked on the charts and opened in the list. It belongs to one space and period:
// a new scope starts clean, while leaving the screen and coming back keeps it.
const useStatsSelection = (scope: string, mode: BreakdownMode) => {
  const [stored, setStored] = useState<Selection>(() => initial(scope));
  const current = stored.scope === scope ? stored : initial(scope);

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
    const dropSegment = !touched.donut && current.segment !== null;
    touchedRef.current = { trend: false, donut: false };

    if (dropTrend || dropSegment) {
      update((selection) => ({
        trendKey: dropTrend ? null : selection.trendKey,
        segment: dropSegment ? null : selection.segment,
      }));
    }
  };

  return {
    selectedTrendKey: current.trendKey,
    selectedSegmentKey: current.segment?.mode === mode ? current.segment.key : null,
    isOtherExpanded: current.expanded[mode],
    selectTrend: (key: string | null) => update(() => ({ trendKey: key })),
    selectSegment: (key: string | null) => update(() => ({ segment: key === null ? null : { mode, key } })),
    toggleOther: () =>
      update((selection) => ({ expanded: { ...selection.expanded, [mode]: !selection.expanded[mode] } })),
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
