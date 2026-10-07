import type { ReactNode } from 'react';
import { forwardRef, useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

import theme from '@shared/theme';

import styles from './style';

export type Ref = BottomSheetModal;

interface Props {
  children: ReactNode;
  onDismiss?: () => void;
  /** Size the sheet to its whole content, up to the screen, instead of a fixed snap point. */
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
  const { height: windowHeight } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const maxHeight = windowHeight - top - theme.spacing.sm;
  // The last measured height, kept so a reopened sheet starts where it was; 1 until the first layout.
  const [contentHeight, setContentHeight] = useState(1);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const height = Math.ceil(event.nativeEvent.layout.height);
    if (height > 0) setContentHeight(height);
  }, []);

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
      snapPoints={[dynamicSizing ? Math.min(contentHeight, maxHeight) : snapPoint]}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleComponent={null}
      onDismiss={onDismiss}
      enablePanDownToClose={enablePanDownToClose}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
    >
      {dynamicSizing ? (
        // The library's dynamic sizing takes an inner scroll view's height and drops what is around it; this measures
        // the whole content. A scrolling view bounds its own height or shrinks under maxHeight.
        <View style={{ maxHeight }} onLayout={handleContentLayout}>
          {children}
        </View>
      ) : (
        <BottomSheetView style={styles.contentContainer}>{children}</BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

export default CustomBottomSheetModal;
