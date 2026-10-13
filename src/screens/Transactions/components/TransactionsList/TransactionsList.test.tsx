import { Provider } from 'react-redux';
import { SectionList, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { mapTransaction } from '@api/models';
import { createAppStore } from '@redux/Store';
import { transactionDto } from '@redux/state/transaction/fixtures';
import TransactionsList from './TransactionsList';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('expo-secure-store');

const rows = ['a', 'b', 'c'].map((id) => mapTransaction(transactionDto({ id, description: id })));
const groups = [{ key: '2026-01-05', label: 'Mon, Jan 5', total: '-30.00', items: rows }];

const renderList = (props: {
  selectionKey?: string;
  restoreId?: string | null;
  onRestored?: () => void;
  highlightId?: string | null;
}) => {
  const element = (next: typeof props) => (
    <Provider store={createAppStore()}>
      <TransactionsList
        groups={groups}
        selectionKey="month"
        header={<View />}
        placeholder={<View />}
        onPressTransaction={jest.fn()}
        onDeleteTransaction={jest.fn()}
        {...next}
      />
    </Provider>
  );
  const view = render(element(props));

  return { rerender: (next: typeof props) => view.rerender(element(next)) };
};

describe('TransactionsList restore', () => {
  let scrollToLocation: jest.SpyInstance;

  beforeEach(() => {
    scrollToLocation = jest.spyOn(SectionList.prototype, 'scrollToLocation').mockImplementation(() => {});
  });
  afterEach(() => scrollToLocation.mockRestore());

  it('brings the row to the top once and says so', () => {
    const onRestored = jest.fn();

    renderList({ restoreId: 'b', onRestored });

    expect(scrollToLocation).toHaveBeenCalledWith(expect.objectContaining({ itemIndex: 1, viewPosition: 0 }));
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('says the row is in place only once it was measured and landed on exactly', () => {
    const onRestored = jest.fn();
    // As in React Native, a row not measured yet makes the scroll fail synchronously.
    scrollToLocation.mockImplementationOnce(function (this: SectionList) {
      this.props.onScrollToIndexFailed?.({ index: 3, highestMeasuredFrameIndex: 0, averageItemLength: 70 });
    });

    renderList({ restoreId: 'c', onRestored });
    expect(onRestored).not.toHaveBeenCalled();

    let row = screen.getByText('c').parent;
    while (row && Object.keys(row.props).join() !== 'onLayout,children') row = row.parent;
    fireEvent(row!, 'layout', { nativeEvent: { layout: { x: 0, y: 900, width: 300, height: 70 } } });

    expect(scrollToLocation).toHaveBeenCalledTimes(2);
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('never goes back to a restored row when a lit row comes and goes', () => {
    const onRestored = jest.fn();
    const { rerender } = renderList({ restoreId: 'b', onRestored });

    rerender({ restoreId: null, highlightId: 'c', onRestored });
    rerender({ restoreId: null, highlightId: null, onRestored });

    expect(scrollToLocation.mock.calls.map(([{ itemIndex }]) => itemIndex)).toEqual([1, 2]);
  });
});

describe('TransactionsList selection', () => {
  const scrollTo = jest.fn();
  let getScrollResponder: jest.SpyInstance;

  beforeEach(() => {
    scrollTo.mockClear();
    getScrollResponder = jest
      .spyOn(SectionList.prototype, 'getScrollResponder')
      .mockImplementation(() => ({ scrollTo }) as unknown as ReturnType<SectionList['getScrollResponder']>);
  });
  afterEach(() => getScrollResponder.mockRestore());

  it('starts a new selection at the top at once, and leaves the same one where it is', () => {
    const { rerender } = renderList({ selectionKey: 'month' });
    rerender({ selectionKey: 'month' });
    expect(scrollTo).not.toHaveBeenCalled();

    rerender({ selectionKey: 'month|coffee' });
    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: false });

    rerender({ selectionKey: 'month|coffee' });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});
