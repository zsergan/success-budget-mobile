import { useEffect, useState } from 'react';

// The current time, kept fresh while the panel stays open so "now" never stops at the moment it opened.
const useNow = (intervalMs = 15_000) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
};

export default useNow;
