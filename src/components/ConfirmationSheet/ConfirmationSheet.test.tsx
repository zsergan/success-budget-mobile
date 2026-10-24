import type { ReactNode, Ref } from 'react';
import { BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { Confirmation } from './ConfirmationSheet';
import ConfirmationSheet from './ConfirmationSheet';

const mockSheet: { props?: { onDismiss?: () => void; enablePanDownToClose?: boolean } } = {};

jest.mock('@components/Modals/BottomSheetModal/useReturnToRest', () => () => ({
  animatedIndex: undefined,
  watch: () => {},
  stop: () => {},
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react');
  const { ScrollView, View } = jest.requireActual('react-native');

  const BottomSheetModal = React.forwardRef(function BottomSheetModal(
    props: { children: ReactNode; onDismiss?: () => void },
    ref: Ref<unknown>,
  ) {
    const [isOpen, setOpen] = React.useState(false);
    mockSheet.props = props;
    React.useImperativeHandle(ref, () => ({
      present: () => setOpen(true),
      dismiss: () => {
        setOpen(false);
        props.onDismiss?.();
      },
      snapToIndex: () => {},
    }));
    return isOpen ? props.children : null;
  });

  return {
    BottomSheetModal,
    BottomSheetBackdrop: () => null,
    BottomSheetView: View,
    BottomSheetScrollView: ScrollView,
  };
});

let pressBack: () => void = () => {};
beforeEach(() => {
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    pressBack = () => handler({} as never);
    return { remove: () => {} };
  });
});
afterEach(() => jest.restoreAllMocks());

const renderSheet = (props: Partial<Confirmation> = {}) => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();
  const all = {
    title: 'Delete transaction?',
    description: '−$50.00 · Grocery · Cash.',
    primaryAction: { label: 'Delete transaction', tone: 'danger' as const, busyLabel: 'Deleting…', onPress: onConfirm },
    onCancel,
    ...props,
  };
  const view = render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 54, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ConfirmationSheet confirmation={all} />
    </SafeAreaProvider>,
  );
  return { ...view, onCancel, onConfirm, all };
};

it('shows the compact confirmation and routes its actions', () => {
  const { onCancel, onConfirm } = renderSheet();

  expect(screen.getByRole('header', { name: 'Delete transaction?' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Delete transaction' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);

  fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  act(() => pressBack());
  expect(onCancel).toHaveBeenCalledTimes(2);
});

it('shows the step, context, consequences and a third action', () => {
  const discard = jest.fn();
  renderSheet({
    step: 'Step 1 of 2',
    consequences: { tone: 'danger', title: 'What gets deleted', items: ['4 wallets', '6 limits'] },
    additionalAction: { label: 'Discard', tone: 'danger', onPress: discard },
    secondaryAction: { label: 'Back', onPress: jest.fn() },
  });

  expect(screen.getByText('Step 1 of 2')).toBeTruthy();
  expect(screen.getByText('What gets deleted')).toBeTruthy();
  expect(screen.getByText('6 limits')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Discard' }));
  expect(discard).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
});

it('gives a message one action and lets Back close it', () => {
  const { onCancel } = renderSheet({ secondaryAction: null, primaryAction: { label: 'Close', onPress: jest.fn() } });

  expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  act(() => pressBack());
  expect(onCancel).toHaveBeenCalledTimes(1);
});

it('locks every way out while pending, and shows an error over the actions', () => {
  const { onCancel, onConfirm } = renderSheet({
    isPending: true,
    message: { text: 'Couldn’t delete. Check your connection and try again.' },
  });

  expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(mockSheet.props?.enablePanDownToClose).toBe(false);
  act(() => pressBack());
  expect(onCancel).not.toHaveBeenCalled();
  expect(onConfirm).not.toHaveBeenCalled();
  expect(screen.getByText('Couldn’t delete. Check your connection and try again.')).toBeTruthy();
});

it('runs a confirmation once until its promise settles', async () => {
  let finish: () => void = () => {};
  const onPress = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
  renderSheet({ primaryAction: { label: 'Archive category', onPress } });

  fireEvent.press(screen.getByRole('button', { name: 'Archive category' }));
  fireEvent.press(screen.getByRole('button', { name: 'Archive category' }));
  expect(onPress).toHaveBeenCalledTimes(1);

  await act(async () => finish());
  fireEvent.press(screen.getByRole('button', { name: 'Archive category' }));
  expect(onPress).toHaveBeenCalledTimes(2);
});

it('cancels on a swipe, but not when its owner hides it, keeping its content meanwhile', () => {
  const { onCancel, rerender } = renderSheet();
  act(() => mockSheet.props?.onDismiss?.());
  expect(onCancel).toHaveBeenCalledTimes(1);

  rerender(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 54, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ConfirmationSheet confirmation={null} />
    </SafeAreaProvider>,
  );
  expect(onCancel).toHaveBeenCalledTimes(1);
});
