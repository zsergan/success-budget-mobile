import { Dimensions, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fireEvent, render, screen } from '@testing-library/react-native';

import BottomModal from './BottomSheetModal';

const mockSheet: { snapPoints?: (number | string)[]; enableDynamicSizing?: boolean } = {};

jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  const BottomSheetModal = React.forwardRef(function BottomSheetModal(
    props: { children: unknown; snapPoints: (number | string)[]; enableDynamicSizing: boolean },
    _ref: unknown,
  ) {
    mockSheet.snapPoints = props.snapPoints;
    mockSheet.enableDynamicSizing = props.enableDynamicSizing;
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

    layOut(420.4);

    expect(mockSheet.snapPoints).toEqual([421]);
  });

  it('follows the content when it changes, up to the screen below the top inset', () => {
    renderSheet('content');
    layOut(300);
    expect(mockSheet.snapPoints).toEqual([300]);

    layOut(5000);

    expect(mockSheet.snapPoints).toEqual([WINDOW_HEIGHT - TOP_INSET - 8]);
  });
});
