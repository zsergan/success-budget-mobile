import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ChartsPrototypeScreen from './ChartsPrototypeScreen';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

const renderScreen = () => {
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ChartsPrototypeScreen />
    </SafeAreaProvider>,
  );
  fireEvent(screen.getByTestId('trend-chart'), 'layout', { nativeEvent: { layout: { width: 323, height: 136 } } });
};

describe('ChartsPrototypeScreen', () => {
  // The chart libraries start animation timers on mount that would otherwise outlive the test.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('opens the tooltip for the tapped pair and closes it on a repeat tap', () => {
    renderScreen();
    const columns = screen.getAllByTestId('trend-column');

    fireEvent.press(columns[3]);
    expect(screen.getByText('21–27 Sep 2026')).toBeTruthy();
    expect(screen.getByText('+$850.00')).toBeTruthy();
    expect(screen.getByText('−$882.10')).toBeTruthy();

    fireEvent.press(columns[3]);
    expect(screen.queryByText('21–27 Sep 2026')).toBeNull();
  });

  it('moves the tooltip to another pair and closes it on a tap outside the chart', () => {
    renderScreen();
    const columns = screen.getAllByTestId('trend-column');

    fireEvent.press(columns[0]);
    fireEvent.press(columns[4]);
    expect(screen.queryByText('1–6 Sep 2026')).toBeNull();
    expect(screen.getByText('28–30 Sep 2026')).toBeTruthy();

    fireEvent.press(screen.getByTestId('prototype-backdrop'));
    expect(screen.queryByText('28–30 Sep 2026')).toBeNull();
  });
});
