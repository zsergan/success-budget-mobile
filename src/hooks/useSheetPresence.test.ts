import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { act, renderHook } from '@testing-library/react-native';

import useSheetPresence from './useSheetPresence';

const setUp = () => {
  const sheet = { present: jest.fn(), dismiss: jest.fn() };
  const hook = renderHook(({ visible }: { visible: boolean }) => useSheetPresence(visible), {
    initialProps: { visible: false },
  });
  hook.result.current.ref.current = sheet as unknown as BottomSheetModal;
  return { ...hook, sheet };
};

it('waits for the closing animation before opening a new draft', () => {
  const { result, rerender, sheet } = setUp();
  rerender({ visible: true });
  rerender({ visible: false });
  rerender({ visible: true });

  expect(sheet.present).toHaveBeenCalledTimes(1);
  expect(result.current.isDismissing()).toBe(true);
  expect(result.current.settleDismiss()).toBe(false);
  expect(sheet.present).toHaveBeenCalledTimes(2);
  expect(result.current.isDismissing()).toBe(false);
});

it('does not reopen if the replacement draft also closed during the animation', () => {
  const { result, rerender, sheet } = setUp();
  rerender({ visible: true });
  rerender({ visible: false });
  rerender({ visible: true });
  rerender({ visible: false });

  expect(sheet.dismiss).toHaveBeenCalledTimes(1);
  expect(result.current.settleDismiss()).toBe(false);
  expect(sheet.present).toHaveBeenCalledTimes(1);
});

it('reports a user dismissal and never dismisses an already closed sheet', () => {
  const { result, rerender, sheet } = setUp();
  expect(sheet.dismiss).not.toHaveBeenCalled();
  rerender({ visible: true });
  act(() => expect(result.current.settleDismiss()).toBe(true));
  rerender({ visible: false });
  expect(sheet.dismiss).not.toHaveBeenCalled();
});

it('presents once however often it is asked to show', () => {
  const { rerender, sheet } = setUp();
  rerender({ visible: true });
  rerender({ visible: true });
  rerender({ visible: true });

  expect(sheet.present).toHaveBeenCalledTimes(1);
});

it('shows nothing again once its owner is gone mid-dismissal', () => {
  const { result, rerender, unmount, sheet } = setUp();
  rerender({ visible: true });
  rerender({ visible: false });
  rerender({ visible: true });
  const { settleDismiss } = result.current;

  unmount();

  expect(settleDismiss()).toBe(false);
  expect(sheet.present).toHaveBeenCalledTimes(1);
});
