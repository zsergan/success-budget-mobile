import type { ReactNode, RefObject } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { Keyboard } from 'react-native';

// Room left between the field and the edge of the visible area once it is scrolled into view.
const MARGIN = 16;

interface FieldReveal {
  show: (field: View) => void;
  release: (field: View) => void;
  // Checks the field again if it is still the focused one.
  refresh: (field: View) => void;
}

const FieldRevealContext = createContext<FieldReveal | null>(null);

// Keeps the focused field's whole block, its message included, inside the visible part of the scroll view.
export const useFieldRevealScroll = (scrollRef: RefObject<ScrollView | null>) => {
  const offset = useRef(0);
  const active = useRef<View | null>(null);
  const isPending = useRef(false);

  // Requests until the next frame share one measurement, so they never queue up competing scrolls.
  const reveal = useCallback(() => {
    if (isPending.current) return;
    isPending.current = true;

    requestAnimationFrame(() => {
      isPending.current = false;
      const field = active.current;
      const scroll = scrollRef.current;
      const viewport = scroll?.getNativeScrollRef();

      if (!field || !scroll || !viewport) return;

      viewport.measureInWindow((_x, top, _width, height) =>
        field.measureInWindow((_fieldX, fieldTop, _fieldWidth, fieldHeight) => {
          // Blurred, replaced or unmounted while it was being measured.
          if (active.current !== field) return;

          const below = fieldTop + fieldHeight + MARGIN - (top + height);
          const above = top + MARGIN - fieldTop;

          if (below > 0) scroll.scrollTo({ y: offset.current + below });
          else if (above > 0) scroll.scrollTo({ y: Math.max(0, offset.current - above) });
        }),
      );
    });
  }, [scrollRef]);

  // The scroll view's new size is reported while it still animates with the keyboard, and natively a scroll
  // beyond its old height is cut short; once the keyboard is up, its geometry has settled.
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', reveal);

    return () => subscription.remove();
  }, [reveal]);

  const value = useMemo<FieldReveal>(
    () => ({
      show: (field) => {
        active.current = field;
        reveal();
      },
      release: (field) => {
        if (active.current === field) active.current = null;
      },
      refresh: (field) => {
        if (active.current === field) reveal();
      },
    }),
    [reveal],
  );

  return {
    value,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = event.nativeEvent.contentOffset.y;
    },
    // The keyboard shrinks the scroll view after the field is focused (on Android it resizes the window).
    onLayout: () => reveal(),
  };
};

export const FieldRevealProvider = ({ value, children }: { value: FieldReveal; children: ReactNode }) => (
  <FieldRevealContext.Provider value={value}>{children}</FieldRevealContext.Provider>
);

// While focused, the field is scrolled into view, and again whenever its block changes size or place (a message or
// counter appears, a multiline text wraps). Spread the returned onLayout on the same view as the ref.
export const useRevealWhileFocused = (field: RefObject<View | null>, isFocused: boolean) => {
  const context = useContext(FieldRevealContext);

  useEffect(() => {
    const node = field.current;

    if (!context || !isFocused || !node) return;

    context.show(node);

    return () => context.release(node);
  }, [context, field, isFocused]);

  const onLayout = () => {
    const node = field.current;

    if (context && node) context.refresh(node);
  };

  return { onLayout };
};
