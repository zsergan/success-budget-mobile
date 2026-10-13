import type { ComponentProps } from 'react';
import { TextInput } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import TransactionsHeader from './TransactionsHeader';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
// Each motion's end is held, so a test says when the field has finished growing or folding.
const mockMotionEnds: ((finished: boolean) => void)[] = [];
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
  withTiming: (value: number, _config: unknown, onEnd?: (finished: boolean) => void) => {
    if (onEnd) mockMotionEnds.push(onEnd);
    return value;
  },
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

  it('says under the field why its text is not searched, and only while searching', () => {
    const error = 'Search is limited to 255 characters';
    renderHeader({ isSearching: true, query: 'a'.repeat(256), error });
    expect(screen.getByRole('alert')).toHaveTextContent(error);

    screen.rerender(
      <TransactionsHeader
        canSearch
        isSearching={false}
        query=""
        error={error}
        onOpen={jest.fn()}
        onCancel={jest.fn()}
        onChangeQuery={jest.fn()}
        onSubmit={jest.fn()}
        onClear={jest.fn()}
      />,
    );
    expect(screen.queryByText(error)).toBeNull();
  });

  describe('the keyboard', () => {
    const focus = TextInput.prototype.focus as jest.Mock;
    const blur = TextInput.prototype.blur as jest.Mock;
    const header = (isSearching: boolean, query = '') => (
      <TransactionsHeader
        canSearch
        isSearching={isSearching}
        query={query}
        onOpen={jest.fn()}
        onCancel={jest.fn()}
        onChangeQuery={jest.fn()}
        onSubmit={jest.fn()}
        onClear={jest.fn()}
      />
    );

    beforeEach(() => {
      mockMotionEnds.length = 0;
      focus.mockClear();
      blur.mockClear();
    });

    it('comes only once the field has grown, and never if search is left first', () => {
      render(header(false));
      blur.mockClear();
      screen.rerender(header(true));
      expect(focus).not.toHaveBeenCalled();

      mockMotionEnds.at(-1)?.(true);
      expect(focus).toHaveBeenCalledTimes(1);

      screen.rerender(header(false));
      expect(blur).toHaveBeenCalledTimes(1);
      screen.rerender(header(true));
      screen.rerender(header(false));
      mockMotionEnds.at(-2)?.(false);
      mockMotionEnds.at(-1)?.(true);
      expect(focus).toHaveBeenCalledTimes(1);
    });

    it('comes back at once after a clear, but not merely as search opens', () => {
      render(header(true));
      expect(focus).not.toHaveBeenCalled();

      screen.rerender(header(true, 'coffee'));
      screen.rerender(header(true, ''));
      expect(focus).toHaveBeenCalledTimes(1);
    });
  });
});
