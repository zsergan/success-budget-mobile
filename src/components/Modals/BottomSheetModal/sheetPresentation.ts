import { createContext, useContext } from 'react';

export interface PresentationState {
  // One showing of the content: it changes only once a close has finished.
  id: number;
  // A close is under way; a close the sheet reverses (kept open) leaves the same showing on screen.
  isClosing: boolean;
}

export interface SheetPresentation {
  current: () => PresentationState;
  subscribe: (listener: () => void) => () => void;
}

// Kept outside React state, so starting to close never re-renders the sheet's content.
export const createSheetPresentation = () => {
  let state: PresentationState = { id: 0, isClosing: false };
  const listeners = new Set<() => void>();

  const set = (next: PresentationState) => {
    if (next.id === state.id && next.isClosing === state.isClosing) return;
    state = next;
    listeners.forEach((listener) => listener());
  };

  return {
    current: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setClosing: (isClosing: boolean) => set({ ...state, isClosing }),
    closed: () => set({ id: state.id + 1, isClosing: false }),
  };
};

export const SheetPresentationContext = createContext<SheetPresentation | null>(null);

// The showing of the sheet this is rendered in; null outside a sheet.
export const useSheetPresentation = () => useContext(SheetPresentationContext);
