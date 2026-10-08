import { useCallback, useEffect, useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

// Shows the sheet while `isVisible`. The library leaves a sheet dismissed before it was ever shown, or after it
// already closed, stuck in its dismissing state, so its next present renders nothing: it is dismissed only while shown.
const useSheetPresence = (isVisible: boolean) => {
  const ref = useRef<BottomSheetModal>(null);
  const isShownRef = useRef(false);
  const isDismissingRef = useRef(false);
  const wantsVisibleRef = useRef(isVisible);
  wantsVisibleRef.current = isVisible;

  useEffect(() => {
    if (isVisible) {
      if (isShownRef.current || isDismissingRef.current) return;
      isShownRef.current = true;
      ref.current?.present();
    } else if (isShownRef.current && !isDismissingRef.current) {
      isDismissingRef.current = true;
      ref.current?.dismiss();
    }
  }, [isVisible]);

  // For the sheet's onDismiss: true when it closed on its own (a swipe or the backdrop), not by `isVisible`.
  const settleDismiss = useCallback(() => {
    const closedByItself = !isDismissingRef.current;
    isShownRef.current = false;
    isDismissingRef.current = false;
    // present() during forceClose() is lost when the old animation unmounts the modal.
    if (!closedByItself && wantsVisibleRef.current) {
      isShownRef.current = true;
      ref.current?.present();
    }
    return closedByItself;
  }, []);

  // Whether a close now under way is one `isVisible` asked for.
  const isDismissing = useCallback(() => isDismissingRef.current, []);

  return { ref, settleDismiss, isDismissing };
};

export default useSheetPresence;
