import { Provider } from 'react-redux';
import { SectionList, View, VirtualizedList } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { mapTransaction } from '@api/models';
import { createAppStore } from '@redux/Store';
import { transactionDto } from '@redux/state/transaction/fixtures';
import TransactionsList from './TransactionsList';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('expo-secure-store');

const row = (id: string) => mapTransaction(transactionDto({ id, description: id }));
const groups = [
  { key: '2026-01-05', label: 'Mon, Jan 5', total: '-30.00', items: ['a', 'b', 'c'].map(row) },
  { key: '2026-01-04', label: 'Sun, Jan 4', total: '-20.00', items: ['d', 'e'].map(row) },
];

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
  // Where each scroll lands, read through SectionList's own index arithmetic: a row's id, or a day's header.
  let landings: { id: string; viewPosition?: number }[];
  let scrollToIndex: jest.SpyInstance;

  beforeEach(() => {
    landings = [];
    scrollToIndex = jest.spyOn(VirtualizedList.prototype, 'scrollToIndex').mockImplementation(function (
      this: VirtualizedList<unknown>,
      { index, viewPosition },
    ) {
      const item = this.props.getItem?.(this.props.data, index) as { id?: string } | undefined;
      landings.push({ id: item?.id ?? 'header', viewPosition });
    });
  });
  afterEach(() => scrollToIndex.mockRestore());

  it.each(['a', 'b', 'd', 'e'])('brings row %s itself to the top once and says so', (id) => {
    const onRestored = jest.fn();

    renderList({ restoreId: id, onRestored });

    expect(landings).toEqual([{ id, viewPosition: 0 }]);
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('says the row is in place only once it was measured and landed on exactly', () => {
    const onRestored = jest.fn();
    // As in React Native, a row not measured yet makes the scroll fail synchronously.
    scrollToIndex.mockImplementationOnce(function (this: VirtualizedList<unknown>) {
      this.props.onScrollToIndexFailed?.({ index: 3, highestMeasuredFrameIndex: 0, averageItemLength: 70 });
    });

    renderList({ restoreId: 'c', onRestored });
    expect(onRestored).not.toHaveBeenCalled();

    let node = screen.getByText('c').parent;
    while (node && Object.keys(node.props).join() !== 'onLayout,children') node = node.parent;
    fireEvent(node!, 'layout', { nativeEvent: { layout: { x: 0, y: 900, width: 300, height: 70 } } });

    expect(landings).toEqual([{ id: 'c', viewPosition: 0 }]);
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('never goes back to a restored row when a lit row comes and goes', () => {
    const onRestored = jest.fn();
    const { rerender } = renderList({ restoreId: 'b', onRestored });

    rerender({ restoreId: null, highlightId: 'd', onRestored });
    rerender({ restoreId: null, highlightId: null, onRestored });

    expect(landings).toEqual([
      { id: 'b', viewPosition: 0 },
      { id: 'd', viewPosition: 0.4 },
    ]);
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
