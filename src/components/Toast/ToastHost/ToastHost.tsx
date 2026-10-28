import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PanResponderGestureState } from 'react-native';
import { Animated, PanResponder, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useKeyboardHeight from '@hooks/useKeyboardHeight';

import type { ShownToast, ToastContent } from '../message';
import Toast from '../Toast';
import { ToastViewContext } from '../ToastProvider';
import styles, { TOAST_BARE_BOTTOM, TOAST_EDGE_GAP, TOAST_TOP_GAP } from './style';

const ENTER_MS = 200;
const REPLACE_MS = 120;
const EXIT_MS = 160;
const ENTER_SHIFT = 12;
const DRAG_START = 8;
const SWIPE_ACROSS = 80;
const SWIPE_TOWARD_EDGE = 24;
const SWIPE_VELOCITY = 0.5;

type Edge = 'top' | 'bottom';

const isSwipeAway = ({ dx, dy, vx, vy }: PanResponderGestureState, edge: Edge) => {
  const towardEdge = edge === 'bottom' ? dy : -dy;
  const towardEdgeVelocity = edge === 'bottom' ? vy : -vy;

  return (
    Math.abs(dx) > SWIPE_ACROSS ||
    (Math.abs(dx) > DRAG_START && Math.abs(vx) > SWIPE_VELOCITY) ||
    towardEdge > SWIPE_TOWARD_EDGE ||
    (towardEdge > DRAG_START && towardEdgeVelocity > SWIPE_VELOCITY)
  );
};

// Draws the app's toast above screens and sheets: rendered after the sheets' portal host, so it stays on top of their
// backdrops and takes its own touches, while everything around it passes through.
const ToastHost = () => {
  const { toast, isSheetShown, tabBarHeight, dismiss, act, pause, resume } = useContext(ToastViewContext);
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const edge: Edge = isSheetShown ? 'top' : 'bottom';
  const placement = isSheetShown
    ? { top: insets.top + TOAST_TOP_GAP }
    : keyboardHeight > 0
      ? { bottom: keyboardHeight + TOAST_EDGE_GAP }
      : tabBarHeight !== null
        ? { bottom: tabBarHeight + TOAST_EDGE_GAP }
        : { bottom: insets.bottom > 0 ? insets.bottom + TOAST_EDGE_GAP : TOAST_BARE_BOTTOM };

  // What is drawn: the toast, or the one fading out after it went.
  const [displayed, setDisplayed] = useState<ShownToast | null>(null);
  if (toast && toast !== displayed) setDisplayed(toast);

  const [{ opacity, shift, drag }] = useState(() => ({
    opacity: new Animated.Value(0),
    shift: new Animated.Value(0),
    drag: new Animated.ValueXY(),
  }));
  // The id of the toast drawn, until its exit ends.
  const onScreenRef = useRef<number | null>(null);
  const animationRef = useRef(0);
  const edgeRef = useRef(edge);
  useLayoutEffect(() => {
    edgeRef.current = edge;
  }, [edge]);

  useEffect(() => {
    const onScreen = onScreenRef.current;

    if (toast) {
      if (onScreen === toast.id) return;

      onScreenRef.current = toast.id;
      animationRef.current += 1;
      drag.setValue({ x: 0, y: 0 });
      opacity.setValue(0);
      if (onScreen !== null) {
        shift.setValue(0);
        Animated.timing(opacity, { toValue: 1, duration: REPLACE_MS, useNativeDriver: true }).start();
      } else {
        shift.setValue(edgeRef.current === 'bottom' ? ENTER_SHIFT : -ENTER_SHIFT);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: ENTER_MS, useNativeDriver: true }),
          Animated.timing(shift, { toValue: 0, duration: ENTER_MS, useNativeDriver: true }),
        ]).start();
      }
      return;
    }

    if (onScreen === null) return;

    // A toast shown meanwhile starts its own animation, so this one's end no longer removes anything.
    const animation = (animationRef.current += 1);
    Animated.timing(opacity, { toValue: 0, duration: EXIT_MS, useNativeDriver: true }).start(() => {
      if (animationRef.current !== animation) return;

      onScreenRef.current = null;
      setDisplayed(null);
    });
  }, [toast, opacity, shift, drag]);

  const toastId = toast?.id;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > DRAG_START || Math.abs(dy) > DRAG_START,
        onPanResponderMove: (_, { dx, dy }) =>
          drag.setValue({ x: dx, y: edge === 'bottom' ? Math.max(0, dy) : Math.min(0, dy) }),
        onPanResponderRelease: (_, gesture) => {
          if (toastId !== undefined && isSwipeAway(gesture, edge)) dismiss(toastId);
          else Animated.spring(drag, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        },
        onPanResponderTerminate: () =>
          Animated.spring(drag, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(),
      }),
    [edge, toastId, dismiss, drag],
  );

  if (!displayed) return null;

  const { id } = displayed;
  const content = (
    displayed.action ? { ...displayed, action: { label: displayed.action.label, onPress: () => act(id) } } : displayed
  ) as ToastContent;
  const isLeaving = toast?.id !== id;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <View testID="toast-position" style={[styles.position, placement]} pointerEvents="box-none">
        <Animated.View
          style={[styles.frame, { opacity, transform: [{ translateY: shift }] }]}
          pointerEvents={isLeaving ? 'none' : 'auto'}
        >
          {/* Dragged by the JS driver, apart from the native fade and shift above. */}
          <Animated.View
            testID="toast-swipe"
            style={{ transform: drag.getTranslateTransform() }}
            onTouchStart={() => pause(id)}
            onTouchEnd={() => resume(id)}
            onTouchCancel={() => resume(id)}
            {...panResponder.panHandlers}
          >
            <Toast content={content} onClose={() => dismiss(id)} />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
};

export default ToastHost;
