import { useState } from 'react';

import type { Period, PeriodUnit } from '@shared/utils';
import { CURRENT_MONTH, currentPeriod, isCurrentMonth, monthPeriodOf, toDateRange } from '@shared/utils';

const usePeriod = () => {
  const [period, setPeriod] = useState<Period>(CURRENT_MONTH);

  return {
    period,
    // Resolved on every render so a current period follows today.
    range: toDateRange(period),
    canReset: !isCurrentMonth(period),
    applyPeriod: setPeriod,
    selectCurrent: (unit: PeriodUnit) => setPeriod(currentPeriod(unit)),
    resetPeriod: () => setPeriod(CURRENT_MONTH),
    openMonthOf: (timestamp: string) => setPeriod(monthPeriodOf(timestamp)),
  };
};

export default usePeriod;
