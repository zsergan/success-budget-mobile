import type { ReactNode, Ref } from 'react';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { toastCount, withToasts } from '@components/Toast/testing';
import useToast from '@hooks/useToast';
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

const deleteWrite = (key: string): PendingWrite => ({
  status: 'unknown',
  operation: {
    type: 'delete',
    spaceId: 1,
    transactionId: 'tx-9',
    version: 1,
    idempotencyKey: key,
    firstSentAt: Date.now(),
  },
});

const UNRELATED_ERROR = 'Couldn’t restore “Cafe”';

const UnrelatedError = () => {
  const toast = useToast();
  useEffect(() => toast.show({ tone: 'error', text: UNRELATED_ERROR, subject: 'category-restore:7' }), [toast]);
  return null;
};

const renderBanner = (writes: PendingWrite[], extra?: ReactNode) => {
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
        {withToasts(
          <>
            <PendingWritesBanner />
            {extra}
          </>,
        )}
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

  it('offers to check unanswered saves, which sends each with its own key, and reports them in one toast', async () => {
    const store = renderBanner([write('key-1', 'unknown'), write('key-2', 'unknown')]);

    expect(screen.getByText('2 saves aren’t confirmed yet')).toBeTruthy();

    await act(async () => fireEvent.press(screen.getByText('Check status')));

    expect(posts().map(([{ headers }]) => headers['Idempotency-Key'])).toEqual(['key-1', 'key-2']);
    expect(store.getState().pendingWrite.writes).toEqual([]);
    expect(screen.queryByText(/confirmed yet/)).toBeNull();
    expect(screen.getByText('2 earlier saves went through')).toBeTruthy();
    expect(toastCount()).toBe(1);
  });

  it('names a mix of creates, edits and deletes as changes', () => {
    renderBanner([write('key-1', 'unknown'), deleteWrite('key-2')]);

    expect(screen.getByText('2 changes aren’t confirmed yet')).toBeTruthy();
  });

  it('reports only the open space’s writes, and keeps the ones still unanswered on offer', async () => {
    const store = renderBanner([write('key-1', 'unknown'), write('key-2', 'unknown', 2), write('key-3', 'unknown')]);
    mockedRequest.mockImplementation(({ headers }: { headers: Record<string, string> }) =>
      headers['Idempotency-Key'] === 'key-3'
        ? Promise.reject(new Error('Network Error'))
        : Promise.resolve({ data: createTransactionResponseDto() }),
    );

    await act(async () => fireEvent.press(screen.getByText('Check status')));

    expect(screen.getByText('An earlier save went through')).toBeTruthy();
    expect(screen.getByText('A save isn’t confirmed yet')).toBeTruthy();
    expect(store.getState().pendingWrite.writes.map(({ operation }) => operation.idempotencyKey)).toEqual(['key-3']);
  });

  it('reports a refusal over what went through, in one toast', async () => {
    renderBanner([write('key-1', 'unknown'), write('key-2', 'unknown')]);
    mockedRequest.mockImplementation(({ headers }: { headers: Record<string, string> }) =>
      headers['Idempotency-Key'] === 'key-2'
        ? Promise.reject({
            response: { status: 422, data: { statusCode: 422, code: 'SOMETHING', message: 'Wallet is closed' } },
          })
        : Promise.resolve({ data: createTransactionResponseDto() }),
    );

    await act(async () => fireEvent.press(screen.getByText('Check status')));

    expect(screen.getByText('An earlier save was refused: Wallet is closed')).toBeTruthy();
    expect(toastCount()).toBe(1);
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
    expect(screen.getByText('Transaction saved')).toBeTruthy();

    fireEvent.press(screen.getByText('Review'));
    fireEvent.press(screen.getByRole('button', { name: 'Discard' }));

    expect(store.getState().pendingWrite.writes).toEqual([]);
    expect(posts()).toHaveLength(1);
    expect(screen.queryByText('A transaction wasn’t saved')).toBeNull();
  });

  it('keeps a create sent again but unanswered on offer, and offers its check from the toast', async () => {
    const store = renderBanner([write('key-1', 'expired')]);
    mockedRequest.mockRejectedValueOnce(new Error('Network Error'));

    fireEvent.press(screen.getByText('Review'));
    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Send' })));

    expect(screen.getByText('Couldn’t confirm the save')).toBeTruthy();
    expect(screen.getByText('A save isn’t confirmed yet')).toBeTruthy();

    await act(async () => fireEvent.press(screen.getAllByRole('button', { name: 'Check status' })[1]));

    expect(posts().map(([{ headers }]) => headers['Idempotency-Key'])).toEqual(['key-1', 'key-1']);
    expect(store.getState().pendingWrite.writes).toEqual([]);
    expect(screen.getByText('An earlier save went through')).toBeTruthy();
  });

  describe('a save sent again without an answer', () => {
    const sendAgainUnanswered = async () => {
      mockedRequest.mockRejectedValueOnce(new Error('Network Error'));
      fireEvent.press(screen.getByText('Review'));
      await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Send' })));
      expect(screen.getByText('Couldn’t confirm the save')).toBeTruthy();
    };

    const checkFromBanner = () =>
      act(async () => fireEvent.press(screen.getAllByRole('button', { name: 'Check status' })[0]));

    it('takes its error away once the banner’s check confirms it, and says it went through', async () => {
      const store = renderBanner([write('key-1', 'expired')]);
      await sendAgainUnanswered();

      await checkFromBanner();

      expect(store.getState().pendingWrite.writes).toEqual([]);
      expect(screen.queryByText('Couldn’t confirm the save')).toBeNull();
      expect(screen.getByText('An earlier save went through')).toBeTruthy();
      expect(toastCount()).toBe(1);
    });

    it('keeps its error and the banner while it is still unanswered, whatever else the check settles', async () => {
      const store = renderBanner([write('key-1', 'expired'), write('key-2', 'unknown')]);
      await sendAgainUnanswered();
      mockedRequest.mockImplementation(({ headers }: { headers: Record<string, string> }) =>
        headers['Idempotency-Key'] === 'key-1'
          ? Promise.reject(new Error('Network Error'))
          : Promise.resolve({ data: createTransactionResponseDto() }),
      );

      await checkFromBanner();

      expect(store.getState().pendingWrite.writes.map(({ operation }) => operation.idempotencyKey)).toEqual(['key-1']);
      expect(screen.getByText('Couldn’t confirm the save')).toBeTruthy();
      expect(screen.getByText('A save isn’t confirmed yet')).toBeTruthy();
    });

    it('leaves another operation’s error alone when the check settles a write', async () => {
      const store = renderBanner([write('key-1', 'unknown')], <UnrelatedError />);
      expect(screen.getByText(UNRELATED_ERROR)).toBeTruthy();

      await checkFromBanner();

      expect(store.getState().pendingWrite.writes).toEqual([]);
      expect(screen.getByText(UNRELATED_ERROR)).toBeTruthy();
    });

    it('says nothing about a check that settles after the space changed', async () => {
      const store = renderBanner([write('key-1', 'expired')]);
      await sendAgainUnanswered();
      let answer!: () => void;
      mockedRequest.mockReturnValue(
        new Promise((resolve) => (answer = () => resolve({ data: createTransactionResponseDto() }))),
      );

      await checkFromBanner();
      act(() => {
        store.dispatch(activateSpace(2));
      });
      await act(async () => answer());
      // Stepped, so the switch's exit animation runs as it would.
      for (let step = 0; step < 10; step += 1) act(() => jest.advanceTimersByTime(100));

      expect(store.getState().pendingWrite.writes).toEqual([]);
      expect(screen.queryByText('An earlier save went through')).toBeNull();
      expect(toastCount()).toBe(0);
    });
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
