import { useState } from 'react';

import type { DateRange } from '@shared/utils';
import { getCurrentMonthRange, getCurrentWeekRange, getCurrentYearRange, getMonthRange } from '@shared/utils';

export type RangePreset = 'week' | 'month' | 'year';

const useTransactionRange = () => {
  const [activeRange, setActiveRange] = useState<DateRange>(() => getCurrentMonthRange());

  const setPresetRange = (preset: RangePreset) => {
    if (preset === 'week') setActiveRange(getCurrentWeekRange());
    else if (preset === 'month') setActiveRange(getCurrentMonthRange());
    else setActiveRange(getCurrentYearRange());
  };

  const resetRange = () => setActiveRange(getCurrentMonthRange());

  const jumpToMonthOf = (timestamp: string) => setActiveRange({ ...getMonthRange(timestamp), preset: 'custom' });

  return {
    activeRange,
    setActiveRange,
    setPresetRange,
    resetRange,
    jumpToMonthOf,
  };
};

export default useTransactionRange;
