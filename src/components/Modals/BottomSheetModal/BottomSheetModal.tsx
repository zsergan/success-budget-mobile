import type { ReactNode } from 'react';
import { forwardRef, useCallback } from 'react';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

import styles from './style';

export type Ref = BottomSheetModal;

interface Props {
  children: ReactNode;
  onDismiss?: () => void;
  /** Size the sheet to its content instead of a fixed snap point. */
  dynamicSizing?: boolean;
  /** Fixed snap point when `dynamicSizing` is false. Defaults to '85%'. */
  snapPoint?: string;
  enablePanDownToClose?: boolean;
  /** Replaces the backdrop's own close, for a sheet that decides itself whether it may close. */
  onBackdropPress?: () => void;
}

const CustomBottomSheetModal = forwardRef<Ref, Props>(function CustomBottomSheetModal(
  { children, onDismiss, dynamicSizing = false, snapPoint = '85%', enablePanDownToClose = true, onBackdropPress },
  ref,
) {
  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={onBackdropPress ? 'none' : 'close'}
        onPress={onBackdropPress}
      />
    ),
    [onBackdropPress],
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={dynamicSizing ? undefined : [snapPoint]}
      enableDynamicSizing={dynamicSizing}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleComponent={null}
      onDismiss={onDismiss}
      enablePanDownToClose={enablePanDownToClose}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
    >
      {dynamicSizing ? (
        // Dynamic sizing needs the content itself as the measured root; an extra BottomSheetView here would compete with it.
        children
      ) : (
        <BottomSheetView style={styles.contentContainer}>{children}</BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

export default CustomBottomSheetModal;
