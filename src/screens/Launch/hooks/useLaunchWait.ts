import { useEffect, useState } from 'react';

// The indicator only appears if the attempt is still running by then, so a fast launch shows the logo alone.
export const SHOW_PROGRESS_AFTER_MS = 400;
export const SLOW_AFTER_MS = 8000;

// How long the running attempt has taken, in the steps the screen shows; a new attempt starts again from nothing.
const useLaunchWait = (startedAt: number, isRunning: boolean) => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!isRunning) return;

    const timers = [SHOW_PROGRESS_AFTER_MS, SLOW_AFTER_MS].map((after) =>
      setTimeout(() => setNow(Date.now()), Math.max(0, startedAt + after - Date.now())),
    );

    return () => timers.forEach(clearTimeout);
  }, [startedAt, isRunning]);

  const elapsed = now - startedAt;

  return {
    showsProgress: isRunning && elapsed >= SHOW_PROGRESS_AFTER_MS,
    isSlow: isRunning && elapsed >= SLOW_AFTER_MS,
  };
};

export default useLaunchWait;
