import { useState } from 'react';

import type { PeriodBarPreset } from '@components';
import type { DateRange } from '@shared/utils';
import { getCurrentMonthRange, getCurrentWeekRange, getCurrentYearRange, getMonthRange } from '@shared/utils';

const usePeriodRange = () => {
  const [activeRange, setActiveRange] = useState<DateRange>(() => getCurrentMonthRange());

  const setPresetRange = (preset: PeriodBarPreset) => {
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

export default usePeriodRange;
