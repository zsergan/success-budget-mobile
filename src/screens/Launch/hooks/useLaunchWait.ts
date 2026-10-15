import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// The indicator only appears if the attempt is still running by then, so a fast launch shows the logo alone.
export const SHOW_PROGRESS_AFTER_MS = 400;
export const SLOW_AFTER_MS = 8000;

// How long the running attempt has taken, in the steps the screen shows; a new attempt starts again from nothing.
// Timers stand still while the app is in the background, so a return to it reads the clock again.
const useLaunchWait = (startedAt: number, isRunning: boolean) => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!isRunning) return;

    const tick = () => setNow(Date.now());
    const timers = [SHOW_PROGRESS_AFTER_MS, SLOW_AFTER_MS].map((after) =>
      setTimeout(tick, Math.max(0, startedAt + after - Date.now())),
    );
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });

    return () => {
      timers.forEach(clearTimeout);
      appState.remove();
    };
  }, [startedAt, isRunning]);

  const elapsed = now - startedAt;

  return {
    showsProgress: isRunning && elapsed >= SHOW_PROGRESS_AFTER_MS,
    isSlow: isRunning && elapsed >= SLOW_AFTER_MS,
  };
};

export default useLaunchWait;
