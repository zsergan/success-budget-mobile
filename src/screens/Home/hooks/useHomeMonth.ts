import { useState } from 'react';

import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { Period } from '@shared/utils';
import { CURRENT_MONTH, monthPeriodOf, shiftPeriod, toDateRange } from '@shared/utils';

// The month Home shows: this one by default, an earlier one on request, never a future one. Another space starts on
// this month again.
const useHomeMonth = () => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const [stored, setStored] = useState<{ spaceId: number | null; period: Period }>({
    spaceId,
    period: CURRENT_MONTH,
  });
  const period = stored.spaceId === spaceId ? stored.period : CURRENT_MONTH;
  if (stored.spaceId !== spaceId) setStored({ spaceId, period });

  const set = (next: Period) => setStored({ spaceId, period: next });
  const isCurrent = period.kind === 'current';

  return {
    period,
    // Resolved on every render, so the current month follows today.
    range: toDateRange(period),
    isCurrent,
    showPrevious: () => set(shiftPeriod(period, -1)),
    showNext: () => {
      if (!isCurrent) set(shiftPeriod(period, 1));
    },
    showCurrent: () => set(CURRENT_MONTH),
    showMonthOf: (timestamp: string) => set(monthPeriodOf(timestamp)),
  };
};

export default useHomeMonth;
