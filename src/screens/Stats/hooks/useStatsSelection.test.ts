import { act, renderHook } from '@testing-library/react-native';

import type { BreakdownMode } from '@screens/Stats/statsItems';
import useStatsSelection from './useStatsSelection';

const setup = (scope = 'september', mode: BreakdownMode = 'category') =>
  renderHook(({ scope: s, mode: m }: { scope: string; mode: BreakdownMode }) => useStatsSelection(s, m), {
    initialProps: { scope, mode },
  });

describe('useStatsSelection', () => {
  it('keeps Other open per breakdown', () => {
    const { result, rerender } = setup();

    act(() => result.current.toggleOther());
    expect(result.current.isOtherExpanded).toBe(true);

    rerender({ scope: 'september', mode: 'wallet' });
    expect(result.current.isOtherExpanded).toBe(false);

    rerender({ scope: 'september', mode: 'category' });
    expect(result.current.isOtherExpanded).toBe(true);
  });

  it('keeps a segment to the breakdown it was picked in', () => {
    const { result, rerender } = setup();

    act(() => result.current.selectSegment('category:12'));
    expect(result.current.selectedSegmentKey).toBe('category:12');

    rerender({ scope: 'september', mode: 'wallet' });
    expect(result.current.selectedSegmentKey).toBeNull();
  });

  it('starts clean in a new space or period', () => {
    const { result, rerender } = setup();

    act(() => {
      result.current.toggleOther();
      result.current.selectSegment('category:12');
      result.current.selectTrend('2026-W39');
    });
    rerender({ scope: 'october', mode: 'category' });

    expect(result.current).toMatchObject({ isOtherExpanded: false, selectedSegmentKey: null, selectedTrendKey: null });
  });

  it('drops a pick on a touch outside its chart and keeps it on a touch inside', () => {
    const { result } = setup();

    act(() => {
      result.current.selectSegment('category:12');
      result.current.selectTrend('2026-W39');
    });

    act(() => {
      result.current.markDonutTouch();
      result.current.handleScreenTouch();
    });
    expect(result.current.selectedSegmentKey).toBe('category:12');
    expect(result.current.selectedTrendKey).toBeNull();

    act(() => result.current.handleScreenTouch());
    expect(result.current.selectedSegmentKey).toBeNull();
  });
});
