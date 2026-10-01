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

  it('steps a Month back and applies it as that month, not as a custom range', () => {
    const { onApply } = renderSheet(CURRENT_MONTH);

    fireEvent.press(screen.getByLabelText('Previous month'));

    expect(screen.getByText('August 2026')).toBeTruthy();
    fireEvent.press(screen.getByText('Apply period'));
    expect(onApply).toHaveBeenCalledWith({ kind: 'past', unit: 'month', anchor: new Date(2026, 7, 1) });
  });

  it('takes the whole week around a tapped day', () => {
    const { onApply } = renderSheet(CURRENT_MONTH);

    fireEvent.press(screen.getByText('Week'));
    fireEvent.press(screen.getByText('22'));

    expect(screen.getByText('21–27 Sep 2026')).toBeTruthy();
    fireEvent.press(screen.getByText('Apply period'));
    expect(onApply).toHaveBeenCalledWith({ kind: 'past', unit: 'week', anchor: new Date(2026, 8, 21) });
  });

  it('steps a Year back without a calendar', () => {
    const { onApply } = renderSheet(CURRENT_MONTH);

    fireEvent.press(screen.getByText('Year'));
    expect(screen.queryByText('22')).toBeNull();
    fireEvent.press(screen.getByLabelText('Previous year'));
    fireEvent.press(screen.getByText('Apply period'));

    expect(onApply).toHaveBeenCalledWith({ kind: 'past', unit: 'year', anchor: new Date(2025, 0, 1) });
  });

  it('goes no further than the current period and leads back to it', () => {
    const { onApply } = renderSheet({ kind: 'past', unit: 'month', anchor: new Date(2026, 4, 1) });

    expect(screen.getByLabelText('Next month').props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByText('Back to this month'));

    expect(screen.getByText('This month')).toBeTruthy();
    expect(screen.getByLabelText('Next month').props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByText('Apply period'));
    expect(onApply).toHaveBeenCalledWith(CURRENT_MONTH);
  });

  it('builds a range of days only in Custom', () => {
    const { onApply } = renderSheet(CURRENT_MONTH);

    fireEvent.press(screen.getByText('Custom'));
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
