import { useCallback, useEffect, useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

// Shows the sheet while `isVisible`. The library leaves a sheet dismissed before it was ever shown, or after it
// already closed, stuck in its dismissing state, so its next present renders nothing: it is dismissed only while shown.
const useSheetPresence = (isVisible: boolean) => {
  const ref = useRef<BottomSheetModal>(null);
  const isShownRef = useRef(false);
  const isDismissingRef = useRef(false);

  useEffect(() => {
    if (isVisible) {
      isShownRef.current = true;
      isDismissingRef.current = false;
      ref.current?.present();
    } else if (isShownRef.current) {
      isDismissingRef.current = true;
      ref.current?.dismiss();
    }
  }, [isVisible]);

  // For the sheet's onDismiss: true when it closed on its own (a swipe or the backdrop), not by `isVisible`.
  const settleDismiss = useCallback(() => {
    const closedByItself = !isDismissingRef.current;
    isShownRef.current = false;
    isDismissingRef.current = false;
    return closedByItself;
  }, []);

  return { ref, settleDismiss };
};

export default useSheetPresence;
