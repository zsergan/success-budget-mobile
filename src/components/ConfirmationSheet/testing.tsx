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
  onAnimate?: (fromIndex: number, toIndex: number) => void;
}

interface OpenSheet {
  props: SheetProps;
  dismiss: () => void;
}

// The sheets on screen, the newest last.
const openSheets: OpenSheet[] = [];
// While held, a dismissed sheet stays on screen, as during its animation, until finishDismissals().
let heldDismissals: { sheet: OpenSheet; finish: () => void }[] | null = null;

// Shows its content only between present() and dismiss(), as the real modal does.
const BottomSheetModal = forwardRef(function BottomSheetModal(props: SheetProps, ref: Ref<unknown>) {
  const [isOpen, setOpen] = useState(false);
  const entryRef = useRef<OpenSheet>({ props, dismiss: () => {} });

  const isKeptOpenRef = useRef(false);

  // As the library: the close starts with onAnimate, whose handler may snap the sheet back instead.
  const dismiss = () => {
    const index = openSheets.indexOf(entryRef.current);
    if (index === -1) return;

    isKeptOpenRef.current = false;
    entryRef.current.props.onAnimate?.(0, -1);
    if (isKeptOpenRef.current) return;

    openSheets.splice(index, 1);
    const finish = () => {
      setOpen(false);
      entryRef.current.props.onDismiss?.();
    };
    if (heldDismissals) heldDismissals.push({ sheet: entryRef.current, finish });
    else finish();
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
    snapToIndex: (index: number) => {
      isKeptOpenRef.current = true;
      entryRef.current.props.onAnimate?.(-1, index);
    },
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

// As the library's backdrop: its onPress, then a close when its press behaviour says so.
export const pressSheetBackdrop = () =>
  act(() => {
    const sheet = topSheet();
    const backdrop = sheet?.props.backdropComponent?.({}) as
      { props: { onPress?: () => void; pressBehavior?: string } } | undefined;
    backdrop?.props.onPress?.();
    if (backdrop?.props.pressBehavior === 'close') sheet?.dismiss();
  });

export const holdDismissals = () => {
  heldDismissals = [];
};

export const finishDismissals = () =>
  act(() => {
    const held = heldDismissals ?? [];
    heldDismissals = null;
    held.forEach(({ finish }) => finish());
  });

// The held closes reversed, as a sheet the user pulls back up or one presented again before it closed.
export const cancelDismissals = () =>
  act(() => {
    const held = heldDismissals ?? [];
    heldDismissals = null;
    held.forEach(({ sheet }) => {
      openSheets.push(sheet);
      sheet.props.onAnimate?.(-1, 0);
    });
  });

export const resetSheets = () => {
  openSheets.splice(0);
  heldDismissals = null;
};

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
