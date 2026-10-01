import { act, renderHook } from '@testing-library/react-native';

import usePeriod from './usePeriod';

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 30, 12) });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('usePeriod', () => {
  it('starts on the current month with nothing to reset', () => {
    const { result } = renderHook(() => usePeriod());

    expect(result.current.period).toEqual({ kind: 'current', unit: 'month' });
    expect(result.current.canReset).toBe(false);
  });

  it('opens the month of a past transaction as a Month, and Reset returns to this month', () => {
    const { result } = renderHook(() => usePeriod());

    act(() => result.current.openMonthOf('2026-08-29T10:00:00.000Z'));

    expect(result.current.period).toEqual({ kind: 'past', unit: 'month', anchor: new Date(2026, 7, 1) });
    expect(result.current.range).toMatchObject({ from: new Date(2026, 7, 1), preset: 'month' });
    expect(result.current.canReset).toBe(true);

    act(() => result.current.resetPeriod());

    expect(result.current.period).toEqual({ kind: 'current', unit: 'month' });
  });

  it('selects the current week or year from a preset', () => {
    const { result } = renderHook(() => usePeriod());

    act(() => result.current.selectCurrent('year'));

    expect(result.current.range).toMatchObject({ from: new Date(2026, 0, 1), preset: 'year' });
    expect(result.current.canReset).toBe(true);
  });
});
