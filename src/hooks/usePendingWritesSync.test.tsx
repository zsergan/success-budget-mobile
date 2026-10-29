import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, screen } from '@testing-library/react-native';

import { withSheetHost } from '@components/ConfirmationSheet/testing';
import { toastCount, withToasts } from '@components/Toast/testing';

import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { activateSpace } from '@redux/state/space/thunks';
import { createTransactionResponseDto } from '@redux/state/transaction/fixtures';
import { TransactionType } from '@shared/enums';
import usePendingWritesSync from './usePendingWritesSync';

const mockedRequest = jest.fn();
jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

jest.useFakeTimers();

beforeEach(() => jest.clearAllMocks());

it.each([
  [4, true],
  [5, false],
])(
  'sends the writes a restart left unanswered once the user is known (open space %i)',
  async (openSpace, isReported) => {
    const operation = {
      type: 'create',
      spaceId: 4,
      idempotencyKey: 'key-1',
      firstSentAt: Date.now(),
      data: {
        wallet_id: 1,
        category_id: 1,
        transaction_type: TransactionType.EXPENSE,
        amount: '12.00',
        timestamp: new Date().toISOString(),
        client_operation_id: 'key-1',
      },
    };
    await AsyncStorage.setItem('pendingTransactionWrites.v1.1', JSON.stringify([{ status: 'sending', operation }]));
    mockedRequest.mockResolvedValue({ data: createTransactionResponseDto() });

    const store = createAppStore();
    store.dispatch(activateSpace(openSpace));
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{withSheetHost(withToasts(children))}</Provider>
    );
    renderHook(() => usePendingWritesSync(), { wrapper });
    await act(async () => jest.runOnlyPendingTimersAsync());
    expect(mockedRequest).not.toHaveBeenCalled();

    act(() => withProfile(store));
    // Settles the writes without running the timer of the toast they show.
    for (let step = 0; step < 5; step += 1) await act(() => jest.advanceTimersByTimeAsync(0));

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/spaces/4/transactions',
        data: operation.data,
        headers: { 'Idempotency-Key': 'key-1' },
      }),
    );
    // Only writes of the open space are reported.
    expect(screen.queryByText('An earlier save went through') !== null).toBe(isReported);
    expect(toastCount()).toBe(isReported ? 1 : 0);
    expect(JSON.parse((await AsyncStorage.getItem('pendingTransactionWrites.v1.1')) ?? '')).toEqual([]);
  },
);
