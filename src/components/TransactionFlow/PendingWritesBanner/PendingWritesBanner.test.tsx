import type { ReactNode, Ref } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import type { PendingWrite } from '@redux/state/pendingWrite/slice';
import { writeSettled, writesRestored } from '@redux/state/pendingWrite/slice';
import { withProfile } from '@redux/state/profile/fixtures';
import { activateSpace } from '@redux/state/space/thunks';
import { createTransactionResponseDto } from '@redux/state/transaction/fixtures';
import { TransactionType } from '@shared/enums';
import PendingWritesBanner from './PendingWritesBanner';

const mockedRequest = jest.fn();
jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

const mockAddAlert = jest.fn();
jest.mock('@hooks/useAlert', () => () => ({ addAlert: mockAddAlert }));

jest.mock('@components/Modals/BottomSheetModal/useReturnToRest', () => () => ({
  animatedIndex: undefined,
  watch: () => {},
  stop: () => {},
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react');
  const { ScrollView, View } = jest.requireActual('react-native');

  const BottomSheetModal = React.forwardRef(function BottomSheetModal(
    props: { children: ReactNode; onDismiss?: () => void },
    ref: Ref<unknown>,
  ) {
    const [isOpen, setOpen] = React.useState(false);
    React.useImperativeHandle(ref, () => ({
      present: () => setOpen(true),
      dismiss: () => {
        setOpen(false);
        props.onDismiss?.();
      },
      snapToIndex: () => {},
    }));
    return isOpen ? props.children : null;
  });

  return {
    BottomSheetModal,
    BottomSheetBackdrop: () => null,
    BottomSheetView: View,
    BottomSheetScrollView: ScrollView,
  };
});

jest.useFakeTimers();

const write = (key: string, status: PendingWrite['status'], spaceId = 1): PendingWrite => ({
  status,
  operation: {
    type: 'create',
    spaceId,
    idempotencyKey: key,
    firstSentAt: Date.now(),
    data: {
      wallet_id: 1,
      category_id: 1,
      transaction_type: TransactionType.EXPENSE,
      amount: '12.00',
      timestamp: new Date(2026, 0, 5, 10, 0).toISOString(),
      description: null,
      client_operation_id: key,
    },
  },
});

const renderBanner = (writes: PendingWrite[]) => {
  const store = createAppStore();
  withProfile(store);
  store.dispatch(activateSpace(1));
  store.dispatch(writesRestored({ userId: 1, writes }));

  render(
    <Provider store={store}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 393, height: 852 },
          insets: { top: 54, right: 0, bottom: 34, left: 0 },
        }}
      >
        <PendingWritesBanner />
      </SafeAreaProvider>
    </Provider>,
  );

  return store;
};

// What shows inside the safe area provider the sheet needs.
const shown = () => {
  const tree = screen.toJSON();
  return tree && !Array.isArray(tree) ? tree.children : tree;
};

const posts = () => mockedRequest.mock.calls.filter(([{ method }]) => method === 'POST');

beforeEach(() => {
  jest.clearAllMocks();
  jest.setSystemTime(new Date(2026, 0, 6, 12, 0));
  mockedRequest.mockResolvedValue({ data: createTransactionResponseDto() });
});

describe('PendingWritesBanner', () => {
  it('shows nothing while every write of this space is settled', () => {
    renderBanner([write('other-space', 'unknown', 2)]);

    expect(shown()).toBeNull();
  });

  it('offers to retry unanswered saves, which sends each with its own key', async () => {
    const store = renderBanner([write('key-1', 'unknown'), write('key-2', 'unknown')]);

    expect(screen.getByText('2 saves aren’t confirmed yet')).toBeTruthy();

    await act(async () => fireEvent.press(screen.getByText('Retry')));

    expect(posts().map(([{ headers }]) => headers['Idempotency-Key'])).toEqual(['key-1', 'key-2']);
    expect(store.getState().pendingWrite.writes).toEqual([]);
    expect(shown()).toBeNull();
    expect(mockAddAlert).toHaveBeenCalledWith('2 earlier saves went through');
  });

  it('leaves a create that ran out to the user: sent again, or discarded', async () => {
    const store = renderBanner([write('key-1', 'expired'), write('key-2', 'expired')]);

    expect(screen.getByText('A transaction wasn’t saved')).toBeTruthy();
    expect(screen.getByText(/-12\.00/)).toBeTruthy();
    expect(posts()).toEqual([]);

    fireEvent.press(screen.getByText('Review'));
    expect(screen.getByRole('header', { name: 'Send this transaction now?' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Send this transaction now?')).toBeNull();
    expect(store.getState().pendingWrite.writes).toHaveLength(2);
    expect(posts()).toEqual([]);

    fireEvent.press(screen.getByText('Review'));
    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Send' })));

    expect(posts()).toHaveLength(1);
    expect(posts()[0][0]).toMatchObject({
      headers: { 'Idempotency-Key': 'key-1' },
      data: { client_operation_id: 'key-1' },
    });
    expect(mockAddAlert).toHaveBeenCalledWith('Transaction saved');

    fireEvent.press(screen.getByText('Review'));
    fireEvent.press(screen.getByRole('button', { name: 'Discard' }));

    expect(store.getState().pendingWrite.writes).toEqual([]);
    expect(posts()).toHaveLength(1);
    expect(shown()).toBeNull();
  });

  it('does nothing for a review whose write was settled meanwhile', () => {
    const store = renderBanner([write('key-1', 'expired'), write('key-2', 'expired')]);

    fireEvent.press(screen.getByText('Review'));
    const discard = screen.getByRole('button', { name: 'Discard' });
    act(() => {
      store.dispatch(writeSettled({ key: 'key-1', status: null }));
    });

    expect(screen.queryByText('Send this transaction now?')).toBeNull();
    fireEvent.press(discard);
    expect(store.getState().pendingWrite.writes).toHaveLength(1);
  });
});
