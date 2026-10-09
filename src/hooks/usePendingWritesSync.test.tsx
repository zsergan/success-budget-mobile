import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { createTransactionResponseDto } from '@redux/state/transaction/fixtures';
import { TransactionType } from '@shared/enums';
import usePendingWritesSync from './usePendingWritesSync';

const mockedRequest = jest.fn();
jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

const mockAddAlert = jest.fn();
jest.mock('@hooks/useAlert', () => () => ({ addAlert: mockAddAlert }));

jest.useFakeTimers();

it('sends the writes a restart left unanswered once the user is known', async () => {
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
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  renderHook(() => usePendingWritesSync(), { wrapper });
  await act(async () => jest.runOnlyPendingTimersAsync());
  expect(mockedRequest).not.toHaveBeenCalled();

  act(() => withProfile(store));
  await act(async () => jest.runOnlyPendingTimersAsync());

  expect(mockedRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'POST',
      url: '/spaces/4/transactions',
      data: operation.data,
      headers: { 'Idempotency-Key': 'key-1' },
    }),
  );
  expect(mockAddAlert).toHaveBeenCalledWith('An earlier save went through');
  expect(JSON.parse((await AsyncStorage.getItem('pendingTransactionWrites.v1.1')) ?? '')).toEqual([]);
});
