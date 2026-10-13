import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { CURRENT_MONTH } from '@shared/utils';
import type { SearchStatus } from './FilterBar';
import FilterBar from './FilterBar';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

const bar = (props: { search?: SearchStatus; income?: string | null; isLoading?: boolean }) => (
  <FilterBar
    period={CURRENT_MONTH}
    income={null}
    expense={null}
    isLoading={false}
    onPresetPress={jest.fn()}
    onOpenPicker={jest.fn()}
    onReset={jest.fn()}
    {...props}
  />
);
const renderBar = (props: Parameters<typeof bar>[0]) => render(bar(props));

const heightOf = (style: unknown) => {
  const { height, lineHeight, marginVertical = 0 } = StyleSheet.flatten(style as never);
  return (height ?? lineHeight) + 2 * Number(marginVertical);
};

describe('FilterBar', () => {
  it.each<[string, SearchStatus | undefined]>([
    ['no search', undefined],
    ['searching', { state: 'searching' }],
    ['found', { state: 'found', count: 3 }],
    ['failed', { state: 'failed' }],
  ])('keeps the search row at one height: %s', (_name, search) => {
    renderBar({ search });

    expect(heightOf(screen.getByTestId('search-status').props.style)).toBe(20);
  });

  it('holds the row empty while no search is sent', () => {
    renderBar({});

    expect(screen.getByTestId('search-status').children).toHaveLength(0);
  });

  it('gives a total the height of its placeholder, so neither shifts what is under it', () => {
    renderBar({ isLoading: true });
    const placeholder = heightOf(screen.getAllByTestId('total-placeholder')[0].props.style);

    screen.rerender(bar({ income: '12.00' }));

    expect(heightOf(screen.getByText(/12/).props.style)).toBe(placeholder);
    expect(heightOf(screen.getByText('—').props.style)).toBe(placeholder);
  });
});
