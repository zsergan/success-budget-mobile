import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { CalendarDate } from '@shared/utils';
import { deviceToday } from '@shared/utils';

const CHECK_EVERY_MS = 60_000;

// Today on the device calendar, moving on past midnight and when the app comes back, so a form left open overnight
// knows which day it is. A short check rather than a timer set for midnight, which a clock change would outrun.
const useToday = (): CalendarDate => {
  const [today, setToday] = useState(deviceToday);

  useEffect(() => {
    const check = () => setToday(deviceToday());
    const timer = setInterval(check, CHECK_EVERY_MS);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });

    return () => {
      clearInterval(timer);
      appState.remove();
    };
  }, []);

  return today;
};

export default useToday;
