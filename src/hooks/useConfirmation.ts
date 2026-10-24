import { useCallback, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import type { Confirmation } from '@components/ConfirmationSheet/ConfirmationSheet';
import { useAppSelector, useAppStore } from '@redux/hooks';
import type { RootState } from '@redux/Store';

export interface ConfirmLock {
  isLocked: () => boolean;
  // Opens what `build` returns unless a confirmation is open or there is no scope; true when it opened. `settle`
  // closes it, so every choice in it calls `settle` first; it is true when the choice still applies.
  ask: (build: (settle: () => boolean) => Confirmation | null) => boolean;
}

interface Asked {
  scope: string;
  confirmation: Confirmation;
}

const KEYBOARD_WAIT_MS = 600;

const selectSessionSpace = ({ auth, space }: RootState) =>
  space.currentSpaceId === null ? null : `${auth.sessionKey}:${space.currentSpaceId}`;

// One confirmation at a time for its owner, which renders `confirmation` in a ConfirmationSheet. It belongs to the
// scope it was asked in (by default the session and space): once that changes it is gone and the next one free.
const useConfirmation = (selectScope: (state: RootState) => string | null = selectSessionSpace) => {
  const store = useAppStore();
  const scope = useAppSelector(selectScope);
  const [asked, setAsked] = useState<Asked | null>(null);
  const askedRef = useRef<Asked | null>(null);

  const isLocked = useCallback(() => {
    const current = askedRef.current;
    return !!current && current.scope === selectScope(store.getState());
  }, [store, selectScope]);

  const ask = useCallback(
    (build: (settle: () => boolean) => Confirmation | null) => {
      const askedIn = selectScope(store.getState());
      if (askedIn === null || isLocked()) return false;

      const entry: { current: Asked | null } = { current: null };
      const settle = () => {
        if (!entry.current || askedRef.current !== entry.current) return false;

        askedRef.current = null;
        setAsked(null);
        return entry.current.scope === selectScope(store.getState());
      };
      const confirmation = build(settle);
      if (!confirmation) return false;

      const asked = { scope: askedIn, confirmation };
      entry.current = asked;
      askedRef.current = asked;
      const show = () => {
        if (askedRef.current === asked) setAsked(asked);
      };
      if (!Keyboard.isVisible()) {
        show();
        return true;
      }

      // A sheet that rose with the keyboard stays risen if its owner renders as the keyboard starts to go (a race
      // in the sheet, on main too), so a question asked over the keyboard renders once the keyboard has gone.
      const subscription = Keyboard.addListener('keyboardDidHide', () => {
        subscription.remove();
        clearTimeout(timeout);
        show();
      });
      const timeout = setTimeout(() => {
        subscription.remove();
        show();
      }, KEYBOARD_WAIT_MS);
      Keyboard.dismiss();
      return true;
    },
    [store, selectScope, isLocked],
  );

  const lock = useMemo<ConfirmLock>(() => ({ isLocked, ask }), [isLocked, ask]);

  return { lock, confirmation: asked && asked.scope === scope ? asked.confirmation : null };
};

export default useConfirmation;
