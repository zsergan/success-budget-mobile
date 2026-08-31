import type { ReactNode } from 'react';
import { forwardRef, useCallback } from 'react';
import { View } from 'react-native';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';

import styles from './style';

export type Ref = BottomSheetModal;

interface Props {
  children: ReactNode;
  onDismiss?: () => void;
}

const CustomBottomSheetModal = forwardRef<Ref, Props>(({ children, onDismiss }, ref) => {
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
      snapPoints={['85%']}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleComponent={null}
      onDismiss={onDismiss}
    >
      <View style={styles.contentContainer}>{children}</View>
    </BottomSheetModal>
  );
});

export default CustomBottomSheetModal;
