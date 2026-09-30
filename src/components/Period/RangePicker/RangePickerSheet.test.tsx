import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Period } from '@shared/utils';
import { CURRENT_MONTH, customPeriod } from '@shared/utils';
import RangePickerSheet from './RangePickerSheet';

const mockClose = jest.fn();
jest.mock('@gorhom/bottom-sheet', () => {
  const { ScrollView } = jest.requireActual('react-native');

  return { BottomSheetScrollView: ScrollView, useBottomSheet: () => ({ close: mockClose }) };
});

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 30, 12) });
  mockClose.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

const metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

const renderSheet = (period: Period) => {
  const onApply = jest.fn();
  const view = render(
    <SafeAreaProvider initialMetrics={metrics}>
      <RangePickerSheet period={period} onApply={onApply} />
    </SafeAreaProvider>,
  );

  return { onApply, ...view };
};

describe('RangePickerSheet', () => {
  it('applies the draft only on Apply', () => {
    const { onApply } = renderSheet(CURRENT_MONTH);

    fireEvent.press(screen.getByText('Week'));
    expect(onApply).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Apply period'));
    expect(onApply).toHaveBeenCalledWith({ kind: 'current', unit: 'week' });
    expect(mockClose).toHaveBeenCalled();
  });

  it('starts every opening from the applied period', () => {
    const { unmount } = renderSheet(CURRENT_MONTH);
    fireEvent.press(screen.getByText('Year'));
    unmount();

    renderSheet(CURRENT_MONTH);

    expect(screen.getByText('30 days selected')).toBeTruthy();
  });

  it('turns a picked day into Custom', () => {
    const { onApply } = renderSheet(CURRENT_MONTH);

    fireEvent.press(screen.getByText('10'));
    fireEvent.press(screen.getByText('Apply period'));

    expect(onApply).toHaveBeenCalledWith(customPeriod(new Date(2026, 8, 10), new Date(2026, 8, 30)));
  });

  it('blocks a custom range over 366 days', () => {
    const { onApply } = renderSheet(customPeriod(new Date(2025, 8, 3), new Date(2026, 8, 2)));

    fireEvent.press(screen.getByText('1'));

    expect(screen.getByText('367 days selected · up to 366')).toBeTruthy();
    fireEvent.press(screen.getByText('Apply period'));
    expect(onApply).not.toHaveBeenCalled();
  });
});
