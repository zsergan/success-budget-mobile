import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Confirmation } from '@components/ConfirmationSheet/ConfirmationSheet';
import { useAppStore } from '@redux/hooks';
import type { RootState } from '@redux/Store';
import { afterKeyboardHides } from '@shared/utils';

export interface ConfirmLock {
  isLocked: () => boolean;
  // Opens what `build` returns unless a confirmation is open or there is no scope; true when it opened. `settle`
  // closes it, so every choice in it calls `settle` first; it is true when the choice still applies.
  ask: (build: (settle: () => boolean) => Confirmation | null) => boolean;
}

interface Asked {
  scope: string;
  confirmation: Confirmation;
  // Stops watching the scope and waiting for the keyboard.
  release: () => void;
}

const selectSessionSpace = ({ auth, space }: RootState) =>
  space.currentSpaceId === null ? null : `${auth.sessionKey}:${space.currentSpaceId}`;

// One confirmation at a time for its owner, which renders `confirmation` in a ConfirmationSheet. It belongs to the
// scope it was asked in (by default the session and space): once that changes it is gone for good, even if the scope
// comes back, and the next one is free.
const useConfirmation = (selectScope: (state: RootState) => string | null = selectSessionSpace) => {
  const store = useAppStore();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const askedRef = useRef<Asked | null>(null);

  const drop = useCallback((asked: Asked) => {
    if (askedRef.current !== asked) return false;

    askedRef.current = null;
    asked.release();
    setConfirmation(null);
    return true;
  }, []);

  // The open confirmation, unless its scope has changed since, which drops it.
  const current = useCallback(() => {
    const asked = askedRef.current;
    if (asked && asked.scope !== selectScope(store.getState())) drop(asked);
    return askedRef.current;
  }, [store, selectScope, drop]);

  useEffect(
    () => () => {
      if (askedRef.current) drop(askedRef.current);
    },
    [drop],
  );

  const isLocked = useCallback(() => current() !== null, [current]);

  const ask = useCallback(
    (build: (settle: () => boolean) => Confirmation | null) => {
      const scope = selectScope(store.getState());
      if (scope === null || current()) return false;

      const entry: { current: Asked | null } = { current: null };
      const settle = () => !!entry.current && current() === entry.current && drop(entry.current);
      const built = build(settle);
      if (!built) return false;

      let cancelWait: (() => void) | null = null;
      // Every change is seen as it is dispatched, so a scope that changes and comes back before a render still drops it.
      const unsubscribe = store.subscribe(() => {
        if (selectScope(store.getState()) !== scope) drop(asked);
      });
      const asked: Asked = {
        scope,
        confirmation: built,
        release: () => {
          unsubscribe();
          cancelWait?.();
        },
      };
      entry.current = asked;
      askedRef.current = asked;
      // The flow sheet below rose with the keyboard; a question asked over it renders once the keyboard has gone.
      cancelWait = afterKeyboardHides(() => {
        if (askedRef.current === asked) setConfirmation(built);
      });
      return true;
    },
    [store, selectScope, current, drop],
  );

  const lock = useMemo<ConfirmLock>(() => ({ isLocked, ask }), [isLocked, ask]);

  return { lock, confirmation };
};

export default useConfirmation;
