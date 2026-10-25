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

const host = (confirmation: Confirmation | null) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 393, height: 852 },
      insets: { top: 54, right: 0, bottom: 34, left: 0 },
    }}
  >
    <ConfirmationSheet confirmation={confirmation} />
  </SafeAreaProvider>
);

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
  const view = render(host(all));
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

  rerender(host(null));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

const deferredPress = () => {
  const settle = { resolve: () => {}, reject: () => {} };
  const onPress = jest.fn(
    () =>
      new Promise<void>((resolve, reject) => {
        settle.resolve = resolve;
        settle.reject = () => reject(new Error('Network error'));
      }),
  );
  return { onPress, settle };
};

it.each(['resolves', 'rejects'] as const)(
  'frees a new opening from an action an earlier one left running, which %s later without unlocking it',
  async (outcome) => {
    const first = deferredPress();
    const second = deferredPress();
    const onCancelSecond = jest.fn();
    const { all, rerender } = renderSheet({ primaryAction: { label: 'Leave space', onPress: first.onPress } });
    fireEvent.press(screen.getByRole('button', { name: 'Leave space' }));

    rerender(host(null));
    const reopened = { ...all, primaryAction: { label: 'Leave space', onPress: second.onPress } };
    rerender(host({ ...reopened, onCancel: onCancelSecond }));

    expect(screen.getByRole('button', { name: 'Leave space' })).toBeEnabled();
    expect(mockSheet.props?.enablePanDownToClose).not.toBe(false);
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancelSecond).toHaveBeenCalledTimes(1);

    rerender(host(null));
    rerender(host(reopened));
    fireEvent.press(screen.getByRole('button', { name: 'Leave space' }));
    expect(second.onPress).toHaveBeenCalledTimes(1);

    await act(async () => {
      if (outcome === 'resolves') first.settle.resolve();
      else first.settle.reject();
    });
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(mockSheet.props?.enablePanDownToClose).toBe(false);
    fireEvent.press(screen.getByRole('button', { name: 'Leave space' }));
    expect(second.onPress).toHaveBeenCalledTimes(1);

    await act(async () => second.settle.resolve());
    fireEvent.press(screen.getByRole('button', { name: 'Leave space' }));
    expect(second.onPress).toHaveBeenCalledTimes(2);
  },
);

it('keeps its action locked while its owner updates the content of the same opening', async () => {
  const action = deferredPress();
  const { all, rerender } = renderSheet({ primaryAction: { label: 'Leave space', onPress: action.onPress } });
  fireEvent.press(screen.getByRole('button', { name: 'Leave space' }));

  rerender(host({ ...all, message: { text: 'Still working on it.' } }));

  expect(screen.getByText('Still working on it.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Leave space' }));
  expect(action.onPress).toHaveBeenCalledTimes(1);

  await act(async () => action.settle.resolve());
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
});

it('does not cancel when its owner hides it while an action runs', () => {
  const action = deferredPress();
  const { onCancel, rerender } = renderSheet({ primaryAction: { label: 'Leave space', onPress: action.onPress } });
  fireEvent.press(screen.getByRole('button', { name: 'Leave space' }));

  rerender(host(null));

  expect(onCancel).not.toHaveBeenCalled();
});
