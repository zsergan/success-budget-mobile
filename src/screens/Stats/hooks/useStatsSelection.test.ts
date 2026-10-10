import { act, renderHook } from '@testing-library/react-native';

import { TransactionType } from '@shared/enums';
import useStatsSelection from './useStatsSelection';

const setup = (scope = 'september') =>
  renderHook(({ scope: s }: { scope: string }) => useStatsSelection(s), { initialProps: { scope } });

describe('useStatsSelection', () => {
  it('starts on expenses by category', () => {
    const { result } = setup();

    expect(result.current).toMatchObject({ breakdownType: TransactionType.EXPENSE, mode: 'category' });
  });

  it('changes the type and the grouping independently', () => {
    const { result } = setup();

    act(() => result.current.changeMode('wallet'));
    act(() => result.current.changeBreakdownType(TransactionType.INCOME));
    expect(result.current).toMatchObject({ breakdownType: TransactionType.INCOME, mode: 'wallet' });

    act(() => result.current.changeMode('category'));
    expect(result.current).toMatchObject({ breakdownType: TransactionType.INCOME, mode: 'category' });
  });

  it('keeps Other open per type and grouping', () => {
    const { result } = setup();

    act(() => result.current.toggleOther());
    expect(result.current.isOtherExpanded).toBe(true);

    act(() => result.current.changeMode('wallet'));
    expect(result.current.isOtherExpanded).toBe(false);

    act(() => result.current.changeBreakdownType(TransactionType.INCOME));
    act(() => result.current.changeMode('category'));
    expect(result.current.isOtherExpanded).toBe(false);

    act(() => result.current.changeBreakdownType(TransactionType.EXPENSE));
    expect(result.current.isOtherExpanded).toBe(true);
  });

  it('drops the segment on a change of type or grouping, and does not bring it back', () => {
    const { result } = setup();

    act(() => result.current.selectSegment('wallet:1'));
    act(() => result.current.changeBreakdownType(TransactionType.INCOME));
    expect(result.current.selectedSegmentKey).toBeNull();

    act(() => result.current.changeBreakdownType(TransactionType.EXPENSE));
    expect(result.current.selectedSegmentKey).toBeNull();

    act(() => result.current.selectSegment('category:12'));
    act(() => result.current.changeMode('wallet'));
    act(() => result.current.changeMode('category'));
    expect(result.current.selectedSegmentKey).toBeNull();
  });

  it('keeps the segment when the active type or grouping is pressed again', () => {
    const { result } = setup();

    act(() => result.current.selectSegment('category:12'));
    act(() => {
      result.current.changeBreakdownType(TransactionType.EXPENSE);
      result.current.changeMode('category');
    });

    expect(result.current.selectedSegmentKey).toBe('category:12');
  });

  it('starts clean in a new space or period, keeping the type and grouping', () => {
    const { result, rerender } = setup();

    act(() => {
      result.current.changeBreakdownType(TransactionType.INCOME);
      result.current.changeMode('wallet');
    });
    act(() => {
      result.current.toggleOther();
      result.current.selectSegment('wallet:1');
      result.current.selectTrend('2026-W39');
    });
    rerender({ scope: 'october' });

    expect(result.current).toMatchObject({
      breakdownType: TransactionType.INCOME,
      mode: 'wallet',
      isOtherExpanded: false,
      selectedSegmentKey: null,
      selectedTrendKey: null,
    });
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
