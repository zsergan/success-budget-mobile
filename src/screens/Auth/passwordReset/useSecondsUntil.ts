import { useEffect, useState } from 'react';

// Read from the clock on every tick rather than decremented, so a backgrounded app never skews the wait.
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

    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [time]);

  return time == null ? 0 : Math.max(0, Math.ceil((time - now) / 1000));
};

export default useSecondsUntil;
