import type { ComponentProps, ReactElement } from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';
import { Easing, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import BottomModal, { FITTED_SHEET_HANDLE_HEIGHT, SHEET_ANIMATION } from './BottomSheetModal';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

interface BackdropProps {
  pressBehavior: string;
  onPress?: () => void;
}

const mockSheet: {
  snapPoints?: (number | string)[];
  enableDynamicSizing?: boolean;
  maxDynamicContentSize?: number;
  animationConfigs?: object;
  handleComponent?: (() => ReactElement) | null;
  enableContentPanningGesture?: boolean;
  keyboardBlurBehavior?: string;
  stackBehavior?: string;
  enablePanDownToClose?: boolean;
  onAnimate?: (fromIndex: number, toIndex: number) => void;
  onDismiss?: () => void;
  backdrop?: () => ReactElement<BackdropProps>;
  snapToIndex: jest.Mock;
} = { snapToIndex: jest.fn() };

// The sheet's way back into place runs on the UI thread; here a test says when it got there.
const mockReturn: { finish?: () => void } = {};
jest.mock('./useReturnToRest', () => (onRest: () => void) => ({
  animatedIndex: undefined,
  watch: () => {
    mockReturn.finish = onRest;
  },
  stop: () => {
    mockReturn.finish = undefined;
  },
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  const BottomSheetModal = React.forwardRef(function BottomSheetModal(
    props: Omit<typeof mockSheet, 'backdrop' | 'snapToIndex'> & {
      children: unknown;
      backdropComponent: (backdropProps: object) => ReactElement<BackdropProps>;
    },
    ref: unknown,
  ) {
    React.useImperativeHandle(ref, () => ({ snapToIndex: mockSheet.snapToIndex }));
    mockSheet.snapPoints = props.snapPoints;
    mockSheet.enableDynamicSizing = props.enableDynamicSizing;
    mockSheet.maxDynamicContentSize = props.maxDynamicContentSize;
    mockSheet.animationConfigs = props.animationConfigs;
    mockSheet.handleComponent = props.handleComponent;
    mockSheet.enableContentPanningGesture = props.enableContentPanningGesture;
    mockSheet.keyboardBlurBehavior = props.keyboardBlurBehavior;
    mockSheet.stackBehavior = props.stackBehavior;
    mockSheet.enablePanDownToClose = props.enablePanDownToClose;
    mockSheet.onAnimate = props.onAnimate;
    mockSheet.onDismiss = props.onDismiss;
    mockSheet.backdrop = () => props.backdropComponent({});
    return props.children;
  });

  return { BottomSheetModal, BottomSheetBackdrop: () => null, BottomSheetView: View };
});

const WINDOW_HEIGHT = Dimensions.get('window').height;
const TOP_INSET = 50;

const renderSheet = (content: string) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 400, height: WINDOW_HEIGHT },
        insets: { top: TOP_INSET, right: 0, bottom: 0, left: 0 },
      }}
    >
      <BottomModal fitContent>
        <Text>{content}</Text>
      </BottomModal>
    </SafeAreaProvider>,
  );

const layOut = (height: number) =>
  fireEvent(screen.getByText(/content/).parent!.parent!, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height } },
  });

describe('BottomModal fitted to its content', () => {
  it('snaps to the height of the whole content, measured outside the library', () => {
    renderSheet('content');
    expect(mockSheet.enableDynamicSizing).toBe(false);
    expect(mockSheet.enableContentPanningGesture).toBe(false);
    expect(mockSheet.keyboardBlurBehavior).toBe('restore');

    layOut(420.4);

    expect(mockSheet.snapPoints).toEqual([421 + FITTED_SHEET_HANDLE_HEIGHT]);
  });

  it('follows the content when it changes, up to the screen below the top inset', () => {
    renderSheet('content');
    layOut(300);
    expect(mockSheet.snapPoints).toEqual([300 + FITTED_SHEET_HANDLE_HEIGHT]);

    layOut(5000);

    expect(mockSheet.snapPoints).toEqual([WINDOW_HEIGHT - TOP_INSET - 8]);
  });

  it("measures the content apart from the sheet's height, so the measurement never feeds back into itself", () => {
    renderSheet('content');

    expect(StyleSheet.flatten(screen.getByText(/content/).parent!.parent!.props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      maxHeight: WINDOW_HEIGHT - TOP_INSET - 8 - FITTED_SHEET_HANDLE_HEIGHT,
    });
  });
});

describe('BottomModal motion', () => {
  it('opens and closes every sheet with one timing, eased out, that Reduce Motion turns off', () => {
    renderSheet('content');

    expect(mockSheet.animationConfigs).toBe(SHEET_ANIMATION);
    expect(SHEET_ANIMATION).toEqual({
      duration: 250,
      easing: expect.any(Function),
      reduceMotion: ReduceMotion.System,
    });
    expect(SHEET_ANIMATION.easing(0.5)).toBeCloseTo(Easing.out(Easing.cubic)(0.5));
    expect(SHEET_ANIMATION).not.toHaveProperty('damping');
  });
});

describe('BottomModal sized by the library', () => {
  const renderDynamic = (props: Partial<ComponentProps<typeof BottomModal>> = {}) =>
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 400, height: WINDOW_HEIGHT },
          insets: { top: TOP_INSET, right: 0, bottom: 34, left: 0 },
        }}
      >
        <BottomModal dynamicSizing {...props}>
          <Text>content</Text>
        </BottomModal>
      </SafeAreaProvider>,
    );

  it('fits the content up to the screen below the top inset, the handle included, with no snap point of its own', () => {
    renderDynamic();

    expect(mockSheet.enableDynamicSizing).toBe(true);
    expect(mockSheet.snapPoints).toBeUndefined();
    expect(mockSheet.maxDynamicContentSize).toBe(WINDOW_HEIGHT - TOP_INSET - 8);
    expect(mockSheet.enableContentPanningGesture).toBe(true);
  });

  it('shows the handle only when asked', () => {
    renderDynamic();
    expect(mockSheet.handleComponent).toBeNull();

    renderDynamic({ showHandle: true });
    render(mockSheet.handleComponent!());

    expect(screen.getByTestId('bottom-sheet-handle')).toBeTruthy();
  });

  it('keeps a sheet fitted outside the library unbounded by it, with its handle', () => {
    renderSheet('content');

    expect(mockSheet.maxDynamicContentSize).toBeUndefined();
    expect(mockSheet.handleComponent).toEqual(expect.any(Function));
  });
});

const renderPlain = (props: Partial<ComponentProps<typeof BottomModal>> = {}) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 400, height: 800 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <BottomModal {...props}>
        <Text>content</Text>
      </BottomModal>
    </SafeAreaProvider>,
  );

describe('BottomModal presentation', () => {
  beforeEach(() => {
    mockSheet.snapToIndex.mockClear();
    mockReturn.finish = undefined;
  });

  it("keeps the library's stacking and closing unless told otherwise", () => {
    renderPlain();

    expect(mockSheet.stackBehavior).toBeUndefined();
    expect(mockSheet.enablePanDownToClose).toBe(true);
    expect(mockSheet.backdrop?.().props.pressBehavior).toBe('close');
  });

  it('stacks above an open sheet when asked to push', () => {
    renderPlain({ stackBehavior: 'push' });

    expect(mockSheet.stackBehavior).toBe('push');
  });

  it('lets no swipe or backdrop press close a sheet that is not dismissible', () => {
    const onBackdropPress = jest.fn();
    renderPlain({ isDismissible: false, onBackdropPress });

    expect(mockSheet.enablePanDownToClose).toBe(false);
    expect(mockSheet.backdrop?.().props).toMatchObject({ pressBehavior: 'none', onPress: undefined });
  });

  it('reports a sheet kept open only once it is back in place', () => {
    const onKeptOpen = jest.fn();
    renderPlain({ shouldKeepOpen: () => true, onKeptOpen });

    act(() => mockSheet.onAnimate?.(0, -1));

    expect(mockSheet.snapToIndex).toHaveBeenCalledWith(0);
    expect(onKeptOpen).not.toHaveBeenCalled();

    act(() => mockReturn.finish?.());

    expect(onKeptOpen).toHaveBeenCalledTimes(1);
  });

  it('lets a swipe close a sheet nothing keeps open, and stops waiting once it is gone', () => {
    let keepOpen = false;
    const onKeptOpen = jest.fn();
    renderPlain({ shouldKeepOpen: () => keepOpen, onKeptOpen });

    act(() => mockSheet.onAnimate?.(0, -1));
    expect(mockSheet.snapToIndex).not.toHaveBeenCalled();

    keepOpen = true;
    act(() => mockSheet.onAnimate?.(0, -1));
    act(() => mockSheet.onDismiss?.());

    expect(mockReturn.finish).toBeUndefined();
    expect(onKeptOpen).not.toHaveBeenCalled();
  });
});
