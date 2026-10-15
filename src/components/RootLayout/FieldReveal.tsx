import type { ReactNode, RefObject } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';

// Room left between the field and the edge of the visible area once it is scrolled into view.
const MARGIN = 16;

interface FieldReveal {
  show: (field: View) => void;
  release: (field: View) => void;
}

const FieldRevealContext = createContext<FieldReveal | null>(null);

// Keeps the focused field's whole block, its message included, inside the visible part of the scroll view.
export const useFieldRevealScroll = (scrollRef: RefObject<ScrollView | null>) => {
  const offset = useRef(0);
  const active = useRef<View | null>(null);

  const reveal = useCallback(() => {
    requestAnimationFrame(() => {
      const field = active.current;
      const scroll = scrollRef.current;
      const viewport = scroll?.getNativeScrollRef();

      if (!field || !scroll || !viewport) return;

      viewport.measureInWindow((_x, top, _width, height) =>
        field.measureInWindow((_fieldX, fieldTop, _fieldWidth, fieldHeight) => {
          const below = fieldTop + fieldHeight + MARGIN - (top + height);
          const above = top + MARGIN - fieldTop;

          if (below > 0) scroll.scrollTo({ y: offset.current + below });
          else if (above > 0) scroll.scrollTo({ y: Math.max(0, offset.current - above) });
        }),
      );
    });
  }, [scrollRef]);

  const value = useMemo<FieldReveal>(
    () => ({
      show: (field) => {
        active.current = field;
        reveal();
      },
      release: (field) => {
        if (active.current === field) active.current = null;
      },
    }),
    [reveal],
  );

  return {
    value,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = event.nativeEvent.contentOffset.y;
    },
    // The keyboard shrinks the scroll view after the field is focused, so the field is checked again.
    onLayout: (_event: LayoutChangeEvent) => reveal(),
  };
};

export const FieldRevealProvider = ({ value, children }: { value: FieldReveal; children: ReactNode }) => (
  <FieldRevealContext.Provider value={value}>{children}</FieldRevealContext.Provider>
);

// While focused, the field is scrolled into view, and again whenever its message changes.
export const useRevealWhileFocused = (field: RefObject<View | null>, isFocused: boolean, message?: string) => {
  const context = useContext(FieldRevealContext);

  useEffect(() => {
    const node = field.current;

    if (!context || !isFocused || !node) return;

    context.show(node);

    return () => context.release(node);
  }, [context, field, isFocused, message]);
};
