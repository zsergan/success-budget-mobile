import type { ReactElement, ReactNode, Ref } from 'react';
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act } from '@testing-library/react-native';

// Test stand-ins for a ConfirmationSheet's native parts. In a test file:
//   jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
//   jest.mock('@components/Modals/BottomSheetModal/useReturnToRest', () =>
//     jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock);

interface SheetProps {
  children: ReactNode;
  onDismiss?: () => void;
  enablePanDownToClose?: boolean;
  backdropComponent?: (props: object) => ReactNode;
}

interface OpenSheet {
  props: SheetProps;
  dismiss: () => void;
}

// The sheets on screen, the newest last.
const openSheets: OpenSheet[] = [];

// Shows its content only between present() and dismiss(), as the real modal does.
const BottomSheetModal = forwardRef(function BottomSheetModal(props: SheetProps, ref: Ref<unknown>) {
  const [isOpen, setOpen] = useState(false);
  const entryRef = useRef<OpenSheet>({ props, dismiss: () => {} });

  const dismiss = () => {
    const index = openSheets.indexOf(entryRef.current);
    if (index === -1) return;

    openSheets.splice(index, 1);
    setOpen(false);
    entryRef.current.props.onDismiss?.();
  };

  useLayoutEffect(() => {
    entryRef.current.props = props;
    entryRef.current.dismiss = dismiss;
  });

  useImperativeHandle(ref, () => ({
    present: () => {
      if (!openSheets.includes(entryRef.current)) openSheets.push(entryRef.current);
      setOpen(true);
    },
    dismiss,
    snapToIndex: () => {},
  }));

  return isOpen ? props.children : null;
});

export const bottomSheetMock = {
  BottomSheetModal,
  BottomSheetBackdrop: () => null,
  BottomSheetView: View,
  BottomSheetScrollView: ScrollView,
  BottomSheetTextInput: TextInput,
  useBottomSheet: () => ({ close: () => {} }),
};

export const useReturnToRestMock = () => ({ animatedIndex: undefined, watch: () => {}, stop: () => {} });

const topSheet = () => openSheets[openSheets.length - 1];

export const topSheetProps = () => topSheet()?.props;

// A swipe the sheet allows: none while it cannot be closed by pulling it down.
export const swipeDownSheet = () =>
  act(() => {
    const sheet = topSheet();
    if (sheet && sheet.props.enablePanDownToClose !== false) sheet.dismiss();
  });

export const pressSheetBackdrop = () =>
  act(() => {
    const backdrop = topSheet()?.props.backdropComponent?.({}) as { props: { onPress?: () => void } } | undefined;
    backdrop?.props.onPress?.();
  });

export const resetSheets = () => openSheets.splice(0);

// Sheets read safe area insets, which a bare render does not provide.
export const withSheetHost = (ui: ReactElement) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 393, height: 852 },
      insets: { top: 54, right: 0, bottom: 34, left: 0 },
    }}
  >
    {ui}
  </SafeAreaProvider>
);
