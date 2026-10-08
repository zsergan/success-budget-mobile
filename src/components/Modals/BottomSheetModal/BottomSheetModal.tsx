import type { ReactNode } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

import theme from '@shared/theme';

import styles from './style';

export type Ref = BottomSheetModal;
export const FITTED_SHEET_HANDLE_HEIGHT = 24;

interface Props {
  children: ReactNode;
  onDismiss?: () => void;
  /** Size the sheet to a content whose root is one BottomSheetView or BottomSheetScrollView holding all of it. */
  dynamicSizing?: boolean;
  /**
   * Size the sheet to its whole content, measured here, up to the screen: for content with a header and actions
   * around an inner scroll view, which the library's dynamic sizing would size to that scroll view alone.
   */
  fitContent?: boolean;
  /** Fixed snap point when neither sizing is set. Defaults to '85%'. */
  snapPoint?: string;
  /** Replaces the backdrop's own close, for a sheet that decides itself whether it may close. */
  onBackdropPress?: () => void;
  /** Asked when a swipe starts to close the sheet; true keeps it open, e.g. to confirm first. */
  shouldKeepOpen?: () => boolean;
}

const CustomBottomSheetModal = forwardRef<Ref, Props>(function CustomBottomSheetModal(
  {
    children,
    onDismiss,
    dynamicSizing = false,
    fitContent = false,
    snapPoint = '85%',
    onBackdropPress,
    shouldKeepOpen,
  },
  ref,
) {
  const sheetRef = useRef<BottomSheetModal>(null);
  useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal, []);

  const { height: windowHeight } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const maxHeight = windowHeight - top - theme.spacing.sm;
  // The last measured height, kept so a reopened sheet starts where it was; 1 until the first layout.
  const [contentHeight, setContentHeight] = useState(1);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const height = Math.ceil(event.nativeEvent.layout.height);
    if (height > 0) setContentHeight(height);
  }, []);

  const handleAnimate = useCallback(
    (_fromIndex: number, toIndex: number) => {
      if (toIndex === -1 && shouldKeepOpen?.()) sheetRef.current?.snapToIndex(0);
    },
    [shouldKeepOpen],
  );

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
      ref={sheetRef}
      index={0}
      snapPoints={
        dynamicSizing
          ? undefined
          : [fitContent ? Math.min(contentHeight + FITTED_SHEET_HANDLE_HEIGHT, maxHeight) : snapPoint]
      }
      enableDynamicSizing={dynamicSizing}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleComponent={fitContent ? undefined : null}
      handleStyle={fitContent ? styles.handle : undefined}
      handleIndicatorStyle={styles.handleIndicator}
      enableContentPanningGesture={!fitContent}
      onDismiss={onDismiss}
      onAnimate={shouldKeepOpen ? handleAnimate : undefined}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {dynamicSizing ? (
        // Dynamic sizing needs the content itself as the measured root; an extra BottomSheetView here would compete with it.
        children
      ) : fitContent ? (
        <View style={{ maxHeight: maxHeight - FITTED_SHEET_HANDLE_HEIGHT }} onLayout={handleContentLayout}>
          {children}
        </View>
      ) : (
        <BottomSheetView style={styles.contentContainer}>{children}</BottomSheetView>
      )}
    </BottomSheetModal>
  );
});

export default CustomBottomSheetModal;
