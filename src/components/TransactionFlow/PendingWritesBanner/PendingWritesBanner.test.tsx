import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import type { PendingWrite } from '@redux/state/pendingWrite/slice';
import { writesRestored } from '@redux/state/pendingWrite/slice';
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
      <PendingWritesBanner />
    </Provider>,
  );

  return store;
};

const posts = () => mockedRequest.mock.calls.filter(([{ method }]) => method === 'POST');

beforeEach(() => {
  jest.clearAllMocks();
  jest.setSystemTime(new Date(2026, 0, 6, 12, 0));
  jest.spyOn(Alert, 'alert');
  mockedRequest.mockResolvedValue({ data: createTransactionResponseDto() });
});

describe('PendingWritesBanner', () => {
  it('shows nothing while every write of this space is settled', () => {
    renderBanner([write('other-space', 'unknown', 2)]);

    expect(screen.toJSON()).toBeNull();
  });

  it('offers to retry unanswered saves, which sends each with its own key', async () => {
    const store = renderBanner([write('key-1', 'unknown'), write('key-2', 'unknown')]);

    expect(screen.getByText('2 saves aren’t confirmed yet')).toBeTruthy();

    await act(async () => fireEvent.press(screen.getByText('Retry')));

    expect(posts().map(([{ headers }]) => headers['Idempotency-Key'])).toEqual(['key-1', 'key-2']);
    expect(store.getState().pendingWrite.writes).toEqual([]);
    expect(screen.toJSON()).toBeNull();
    expect(mockAddAlert).toHaveBeenCalledWith('2 earlier saves went through');
  });

  it('leaves a create that ran out to the user: sent again, or discarded', async () => {
    const store = renderBanner([write('key-1', 'expired'), write('key-2', 'expired')]);

    expect(screen.getByText('A transaction wasn’t saved')).toBeTruthy();
    expect(screen.getByText(/-12\.00/)).toBeTruthy();
    expect(posts()).toEqual([]);

    fireEvent.press(screen.getByText('Review'));
    await act(async () => (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress());

    expect(posts()).toHaveLength(1);
    expect(posts()[0][0]).toMatchObject({
      headers: { 'Idempotency-Key': 'key-1' },
      data: { client_operation_id: 'key-1' },
    });
    expect(mockAddAlert).toHaveBeenCalledWith('Transaction saved');

    fireEvent.press(screen.getByText('Review'));
    act(() => (Alert.alert as jest.Mock).mock.calls[1][2][0].onPress());

    expect(store.getState().pendingWrite.writes).toEqual([]);
    expect(posts()).toHaveLength(1);
  });
});
