import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// Read from the clock on every tick and on return to the app, never decremented: a timer paused in the
// background, a locked phone or the keyboard can't skew it.
const useSecondsUntil = (time: number | null | undefined) => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (time == null) return;

    const tick = () => {
      setNow(Date.now());

      if (Date.now() >= time) clearInterval(timer);
    };

    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });

    return () => {
      clearTimeout(first);
      clearInterval(timer);
      foreground.remove();
    };
  }, [time]);

  return time == null ? 0 : Math.max(0, Math.ceil((time - now) / 1000));
};

export default useSecondsUntil;
