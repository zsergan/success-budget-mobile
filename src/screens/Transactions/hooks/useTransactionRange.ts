import { useState } from 'react';

import type { DateRange } from '@shared/utils';
import { getCurrentMonthRange, getCurrentWeekRange, getCurrentYearRange, getMonthRange } from '@shared/utils';

export type RangePreset = 'week' | 'month' | 'year';

/**
 * Owns which period the screen is showing. Deliberately knows nothing about
 * the fetch result — jumping to the latest transaction takes its timestamp as
 * an argument rather than reaching into transaction state.
 */
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
