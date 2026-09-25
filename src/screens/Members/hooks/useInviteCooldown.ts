import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useAppSelector } from '@redux/hooks';
import { selectInviteCooldownUntil } from '@redux/state/member/selectors';

// Kept in redux: the backend's cooldown isn't per space and outlives this screen.
const useInviteCooldown = () => {
  const cooldownUntil = useAppSelector(selectInviteCooldownUntil);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (cooldownUntil === null) return undefined;

    const tick = () => setNow(Date.now());

    // Tick once right away; `now` may predate this cooldown and would stay stale for a second.
    const immediate = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });

    return () => {
      clearTimeout(immediate);
      clearInterval(interval);
      subscription.remove();
    };
  }, [cooldownUntil]);

  const remainingSeconds = cooldownUntil === null ? 0 : Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  return { remainingSeconds };
};

export default useInviteCooldown;
