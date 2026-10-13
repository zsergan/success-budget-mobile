import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import TransactionsHeader from './TransactionsHeader';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));

const renderHeader = (props: Partial<ComponentProps<typeof TransactionsHeader>> = {}) => {
  const handlers = {
    onOpen: jest.fn(),
    onCancel: jest.fn(),
    onChangeQuery: jest.fn(),
    onSubmit: jest.fn(),
    onClear: jest.fn(),
  };

  render(<TransactionsHeader canSearch isSearching={false} query="" {...handlers} {...props} />);

  return handlers;
};

describe('TransactionsHeader', () => {
  it('shows the title and a search button, with the field and Cancel hidden from screen readers', () => {
    const { onOpen } = renderHeader();

    expect(screen.getByText('Transactions')).toBeTruthy();
    expect(screen.queryByLabelText('Search transactions', { includeHiddenElements: false })).toBeTruthy();
    expect(screen.queryByText('Cancel', { includeHiddenElements: false })).toBeNull();
    expect(screen.queryByPlaceholderText('Description, category, wallet')).toBeNull();
    expect(
      screen.getByPlaceholderText('Description, category, wallet', { includeHiddenElements: true }).props.editable,
    ).toBe(false);

    fireEvent.press(screen.getByRole('button', { name: 'Search transactions' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('turns into a field with Cancel while searching, and hides the title from screen readers', () => {
    const { onCancel, onChangeQuery, onSubmit } = renderHeader({ isSearching: true });
    const field = screen.getByPlaceholderText('Description, category, wallet');

    expect(field.props.editable).toBe(true);
    expect(field.props.returnKeyType).toBe('search');
    expect(screen.queryByText('Transactions', { includeHiddenElements: false })).toBeNull();
    expect(screen.queryByLabelText('Clear search')).toBeNull();

    fireEvent.changeText(field, 'coffee');
    fireEvent(field, 'submitEditing');
    fireEvent.press(screen.getByText('Cancel'));

    expect(onChangeQuery).toHaveBeenCalledWith('coffee');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('clears a typed search with the button in the field', () => {
    const { onClear } = renderHeader({ isSearching: true, query: 'coffee' });

    fireEvent.press(screen.getByLabelText('Clear search'));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('offers no search under a Stats filter', () => {
    renderHeader({ canSearch: false });

    expect(screen.queryByLabelText('Search transactions')).toBeNull();
    expect(screen.getByText('Transactions')).toBeTruthy();
  });
});
