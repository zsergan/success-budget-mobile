import type { ReactNode } from 'react';
import { forwardRef, useCallback } from 'react';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

import styles from './style';

export type Ref = BottomSheetModal;

interface Props {
  children: ReactNode;
  onDismiss?: () => void;
  /**
   * Size the sheet to its content instead of the fixed 85% snap point — for
   * shorter, non-form sheets (e.g. the transactions range picker) where a
   * fixed-height sheet leaves a large blank area below the content.
   */
  dynamicSizing?: boolean;
}

const CustomBottomSheetModal = forwardRef<Ref, Props>(function CustomBottomSheetModal(
  { children, onDismiss, dynamicSizing = false },
  ref,
) {
  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={dynamicSizing ? undefined : ['85%']}
      enableDynamicSizing={dynamicSizing}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleComponent={null}
      onDismiss={onDismiss}
    >
      {dynamicSizing ? (
        // A dynamically-sized sheet's content must itself be the measured
        // root (typically a BottomSheetScrollView, which reports its own
        // content height) — wrapping it in another BottomSheetView here
        // would give the library two competing height sources instead of
        // one.
        children
      ) : (
        <BottomSheetView style={styles.contentContainer}>{children}</BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

export default CustomBottomSheetModal;
