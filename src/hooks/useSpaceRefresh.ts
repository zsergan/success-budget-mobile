import { useEffect, useEffectEvent, useState } from 'react';

import { useAppDispatch } from '@redux/hooks';
import { refreshSpaceData } from '@redux/state/space/thunks';
import useRefreshOnReturn from './useRefreshOnReturn';

const DAY_MS = 24 * 60 * 60 * 1000;

const monthKey = (date: Date) => date.getFullYear() * 12 + date.getMonth();

// Asks again for the space's data on a return to the screen or the app, and when a new month begins. The render a
// new month causes moves a current period (resolved during render) onto it.
const useSpaceRefresh = () => {
  const dispatch = useAppDispatch();
  const [month, setMonth] = useState(() => monthKey(new Date()));

  const checkMonth = () => {
    const current = monthKey(new Date());
    if (current === month) return false;

    setMonth(current);
    dispatch(refreshSpaceData({ force: true }));
    return true;
  };
  const handleTimer = useEffectEvent(checkMonth);

  useRefreshOnReturn(() => {
    if (!checkMonth()) dispatch(refreshSpaceData());
  });

  // A timer longer than about 24 days overflows, so it wakes at least daily until the month turns.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      timer = setTimeout(
        () => {
          handleTimer();
          arm();
        },
        Math.min(nextMonth.getTime() - now.getTime(), DAY_MS),
      );
    };

    arm();
    return () => clearTimeout(timer);
  }, []);
};

export default useSpaceRefresh;
