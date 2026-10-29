import type { ReactNode } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomSheetBackdropProps, BottomSheetModalProps } from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

import { ToastSheetPresence } from '@components/Toast/ToastProvider';
import useThemedStyles from '@hooks/useThemedStyles';
import theme from '@shared/theme';

import { createSheetPresentation, SheetPresentationContext } from './sheetPresentation';
import createStyles from './style';
import useReturnToRest from './useReturnToRest';

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
  /** On a sheet already open: 'push' keeps that one in place beneath it. Defaults to the library's 'switch'. */
  stackBehavior?: BottomSheetModalProps['stackBehavior'];
  /** False while the sheet waits on its action: no swipe or backdrop press closes it, only its owner hiding it. */
  isDismissible?: boolean;
  /** Asked when a swipe starts to close the sheet; true keeps it open, e.g. to confirm first. */
  shouldKeepOpen?: () => boolean;
  /** Called once a sheet kept open is back at rest, so what it leads to never opens mid-animation. */
  onKeptOpen?: () => void;
  onHandleTouch?: () => void;
}

const CustomBottomSheetModal = forwardRef<Ref, Props>(function CustomBottomSheetModal(
  {
    children,
    onDismiss,
    dynamicSizing = false,
    fitContent = false,
    snapPoint = '85%',
    onBackdropPress,
    stackBehavior,
    isDismissible = true,
    shouldKeepOpen,
    onKeptOpen,
    onHandleTouch,
  },
  ref,
) {
  const styles = useThemedStyles(createStyles);
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

  const [presentation] = useState(createSheetPresentation);

  const handleKeptOpen = useCallback(() => onKeptOpen?.(), [onKeptOpen]);
  const { animatedIndex, watch: watchReturn, stop: stopWatchingReturn } = useReturnToRest(handleKeptOpen);

  const handleAnimate = useCallback(
    (_fromIndex: number, toIndex: number) => {
      if (toIndex === -1 && shouldKeepOpen?.()) {
        watchReturn();
        sheetRef.current?.snapToIndex(0);
        return;
      }
      presentation.setClosing(toIndex === -1);
    },
    [presentation, shouldKeepOpen, watchReturn],
  );

  const handleDismiss = useCallback(() => {
    stopWatchingReturn();
    presentation.closed();
    onDismiss?.();
  }, [onDismiss, presentation, stopWatchingReturn]);

  const renderHandle = useCallback(
    () => (
      <View style={styles.handle} onTouchStart={onHandleTouch} testID="bottom-sheet-handle">
        <View style={[styles.handleIndicator, !isDismissible && styles.handleIndicatorLocked]} />
      </View>
    ),
    [onHandleTouch, styles, isDismissible],
  );

  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={onBackdropPress || !isDismissible ? 'none' : 'close'}
        onPress={isDismissible ? onBackdropPress : undefined}
      />
    ),
    [onBackdropPress, isDismissible],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      stackBehavior={stackBehavior}
      animatedIndex={animatedIndex}
      snapPoints={
        dynamicSizing
          ? undefined
          : [fitContent ? Math.min(contentHeight + FITTED_SHEET_HANDLE_HEIGHT, maxHeight) : snapPoint]
      }
      enableDynamicSizing={dynamicSizing}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleComponent={fitContent ? renderHandle : null}
      enableContentPanningGesture={!fitContent}
      enablePanDownToClose={isDismissible}
      onDismiss={handleDismiss}
      onAnimate={handleAnimate}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {/* Mounted with the sheet's content: from its presentation until its closing animation ends. */}
      <ToastSheetPresence />
      <SheetPresentationContext.Provider value={presentation}>
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
      </SheetPresentationContext.Provider>
    </BottomSheetModal>
  );
});

export default CustomBottomSheetModal;
