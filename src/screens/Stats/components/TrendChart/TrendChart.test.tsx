import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import TrendChart from './TrendChart';
import type { TrendGroup } from './trendAdapter';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));

const group = (key: string, overrides: Partial<TrendGroup> = {}): TrendGroup => ({
  key,
  label: key,
  sub: '',
  dates: `${key} Sep 2026`,
  income: '850.00',
  expense: '882.10',
  incomeValue: 850,
  expenseValue: 882.1,
  isCurrent: false,
  isFuture: false,
  isZero: false,
  ...overrides,
});

const GROUPS = [
  group('W1'),
  group('W2'),
  group('W3', { isFuture: true, income: '0.00', expense: '0.00', incomeValue: 0, expenseValue: 0 }),
];

const Harness = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  return <TrendChart groups={GROUPS} currency="USD" selectedKey={selectedKey} onSelect={setSelectedKey} />;
};

const renderChart = () => {
  render(<Harness />);
  fireEvent(screen.getByTestId('trend-chart'), 'layout', { nativeEvent: { layout: { width: 323, height: 136 } } });
};

describe('TrendChart', () => {
  // The chart library starts animation timers on mount that would otherwise outlive the test.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('opens the tooltip for the whole tapped interval and closes it on a repeat tap', () => {
    renderChart();

    fireEvent.press(screen.getByTestId('trend-group-W2'));
    expect(screen.getByText('W2 Sep 2026')).toBeTruthy();
    expect(screen.getByText('+$850.00')).toBeTruthy();
    expect(screen.getByText('−$882.10')).toBeTruthy();

    fireEvent.press(screen.getByTestId('trend-group-W2'));
    expect(screen.queryByTestId('trend-tooltip')).toBeNull();
  });

  it('moves the selection to another interval', () => {
    renderChart();

    fireEvent.press(screen.getByTestId('trend-group-W1'));
    fireEvent.press(screen.getByTestId('trend-group-W2'));

    expect(screen.getByText('W2 Sep 2026')).toBeTruthy();
    expect(screen.queryByText('W1 Sep 2026')).toBeNull();
  });

  it('does not select an interval that has not started', () => {
    renderChart();

    fireEvent.press(screen.getByTestId('trend-group-W1'));
    fireEvent.press(screen.getByTestId('trend-group-W3'));

    expect(screen.queryByTestId('trend-tooltip')).toBeNull();
  });

  it('keeps the tooltip inside the chart at either edge', () => {
    renderChart();

    fireEvent.press(screen.getByTestId('trend-group-W1'));
    expect(screen.getByTestId('trend-tooltip')).toHaveStyle({ left: 0 });

    fireEvent.press(screen.getByTestId('trend-group-W2'));
    const { left } = screen.getByTestId('trend-tooltip').props.style.find((s: { left?: number }) => 'left' in s);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(left + 150).toBeLessThanOrEqual(323);
  });
});
