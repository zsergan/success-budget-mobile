import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { CategoryBreakdownItem, OtherBreakdownItem } from '@api/dto';
import { AppColor } from '@shared/enums';
import DonutChart from './DonutChart';
import { DONUT_SIZE, RADIUS } from './donutGeometry';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => true,
}));

const category = (id: number, amount: string, percent: number): CategoryBreakdownItem => ({
  kind: 'category',
  key: `category:${id}`,
  id,
  name: `Category ${id}`,
  icon: 'Grocery',
  color: AppColor.CLAY,
  is_archived: false,
  opens_history: true,
  amount,
  percent,
});

const other: OtherBreakdownItem<CategoryBreakdownItem> = {
  kind: 'other',
  key: 'other',
  id: null,
  name: null,
  icon: null,
  color: null,
  is_archived: false,
  opens_history: false,
  amount: '250.00',
  percent: 25,
  children: [category(3, '150.00', 15), category(4, '100.00', 10)],
};

const GROUPS = [category(1, '500.00', 50), category(2, '250.00', 25), other];

const Harness = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  return (
    <DonutChart
      groups={GROUPS}
      totalAmount="1000.00"
      sourceCount={4}
      currency="USD"
      mode="category"
      selectedKey={selectedKey}
      onSelect={setSelectedKey}
    />
  );
};

const tapAt = (degrees: number, radius = RADIUS) => {
  const radians = (degrees * Math.PI) / 180;
  fireEvent.press(screen.getByTestId('donut-chart'), {
    nativeEvent: {
      locationX: DONUT_SIZE / 2 + radius * Math.sin(radians),
      locationY: DONUT_SIZE / 2 - radius * Math.cos(radians),
    },
  });
};

describe('DonutChart', () => {
  it('shows the total spent and the number of groups by default', () => {
    render(<Harness />);

    expect(screen.getByText('Spent')).toBeTruthy();
    expect(screen.getByText('$1,000.00')).toBeTruthy();
    expect(screen.getByText('4 categories')).toBeTruthy();
  });

  it('shows a picked segment and clears it on a repeat tap', () => {
    render(<Harness />);

    tapAt(90);
    expect(screen.getByText('Category 1')).toBeTruthy();
    expect(screen.getByText('$500.00')).toBeTruthy();
    expect(screen.getByText('50.0%')).toBeTruthy();

    tapAt(90);
    expect(screen.getByText('Spent')).toBeTruthy();
  });

  it('shows Other as its total and how many groups it holds', () => {
    render(<Harness />);

    tapAt(315);
    expect(screen.getByText('Other')).toBeTruthy();
    expect(screen.getByText('$250.00')).toBeTruthy();
    expect(screen.getByText('2 categories')).toBeTruthy();
  });

  it('clears the pick on a tap in the hole', () => {
    render(<Harness />);

    tapAt(90);
    tapAt(0, 0);
    expect(screen.getByText('Spent')).toBeTruthy();
  });

  it('lets a screen reader step through the segments and announces the pick', () => {
    render(<Harness />);
    const donut = screen.getByRole('adjustable');
    const step = (actionName: 'increment' | 'decrement') =>
      fireEvent(donut, 'accessibilityAction', { nativeEvent: { actionName } });

    step('increment');
    expect(screen.getByRole('adjustable').props.accessibilityValue).toEqual({
      text: 'Category 1, $500.00, 50.0%',
    });

    step('decrement');
    expect(screen.getByRole('adjustable').props.accessibilityValue.text).toBe('Spent, $1,000.00, 4 categories');

    step('decrement');
    expect(screen.getByRole('adjustable').props.accessibilityValue.text).toBe('Other, $250.00, 2 categories');
  });
});
