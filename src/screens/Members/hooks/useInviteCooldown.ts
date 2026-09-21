import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useAppSelector } from '@redux/hooks';
import { selectInviteCooldownUntil } from '@redux/state/member/selectors';

/**
 * Ticks a countdown down from an absolute deadline stored in redux (see
 * member.inviteCooldownUntil) rather than owning the deadline itself --
 * this component tree can mount and unmount (closing/reopening Members,
 * switching spaces) without losing or resetting a cooldown the backend is
 * still enforcing.
 */
const useInviteCooldown = () => {
  const cooldownUntil = useAppSelector(selectInviteCooldownUntil);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (cooldownUntil === null) return undefined;

    const tick = () => setNow(Date.now());

    // A plain `setInterval` would leave `now` stale (from whenever it was
    // last set, possibly long before this cooldown started) for up to a
    // full second -- fire once right away, asynchronously, then tick every
    // second after that.
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
