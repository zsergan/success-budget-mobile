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

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

const createData = {
  category_id: 1,
  transaction_type: TransactionType.EXPENSE,
  amount: '12.00',
  timestamp: '2026-01-05T10:00:00.000Z',
  client_operation_id: 'key-1',
};

const mount = (openSpace: number) => {
  const store = createAppStore();
  store.dispatch(activateSpace(openSpace));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{withSheetHost(withToasts(children))}</Provider>
  );
  renderHook(() => usePendingWritesSync(), { wrapper });

  return store;
};

// Settles the writes without running the timer of the toast they show.
const settle = async () => {
  for (let step = 0; step < 5; step += 1) await act(() => jest.advanceTimersByTimeAsync(0));
};

const storedWrites = async () => JSON.parse((await AsyncStorage.getItem('pendingTransactionWrites.v2.1')) ?? 'null');

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
      data: { ...createData, assignment: { kind: 'member', user_id: 1 } },
    };
    await AsyncStorage.setItem(
      'pendingTransactionWrites.v2.1',
      JSON.stringify({ version: 2, writes: [{ status: 'sending', operation }] }),
    );
    mockedRequest.mockResolvedValue({ data: createTransactionResponseDto() });

    const store = mount(openSpace);
    await act(async () => jest.runOnlyPendingTimersAsync());
    expect(mockedRequest).not.toHaveBeenCalled();

    act(() => withProfile(store));
    await settle();

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
    expect(await storedWrites()).toEqual({ version: 2, writes: [] });
  },
);

describe('writes an older build left', () => {
  const legacyCreate = {
    type: 'create',
    spaceId: 4,
    idempotencyKey: 'key-1',
    firstSentAt: Date.now(),
    data: { ...createData, wallet_id: 1 },
  };

  it('looks a create up by its operation id in its own space before sending anything, and keeps it to retry', async () => {
    await AsyncStorage.setItem(
      'pendingTransactionWrites.v1.1',
      JSON.stringify([{ status: 'unknown', operation: legacyCreate }]),
    );
    mockedRequest.mockRejectedValue({
      response: {
        status: 404,
        data: { statusCode: 404, code: 'TRANSACTION_OPERATION_NOT_FOUND', message: 'Not found' },
      },
    });

    const store = mount(5);
    act(() => withProfile(store));
    await settle();

    expect(mockedRequest.mock.calls.map(([config]) => [config.method, config.url])).toEqual([
      ['GET', '/spaces/4/transactions/operations/key-1'],
    ]);
    expect(store.getState().pendingWrite.writes).toEqual([
      {
        status: 'retry',
        operation: {
          type: 'create',
          spaceId: 4,
          idempotencyKey: 'key-1',
          firstSentAt: legacyCreate.firstSentAt,
          data: { ...createData, assignment: { kind: 'space' } },
          recovered: true,
        },
      },
    ]);
    expect(await AsyncStorage.getItem('pendingTransactionWrites.v1.1')).toBeNull();
    expect((await storedWrites()).writes).toMatchObject([{ status: 'retry', operation: { idempotencyKey: 'key-1' } }]);
  });

  it('says a wallet-only edit was not kept, and re-reads that space', async () => {
    const edit = {
      type: 'update',
      spaceId: 4,
      transactionId: 'tx-1',
      version: 2,
      idempotencyKey: 'key-2',
      firstSentAt: 0,
      data: { wallet_id: 3 },
    };
    await AsyncStorage.setItem(
      'pendingTransactionWrites.v1.1',
      JSON.stringify([{ status: 'unknown', operation: edit }]),
    );

    const store = mount(4);
    act(() => withProfile(store));
    await settle();

    expect(mockedRequest.mock.calls.filter(([config]) => config.method !== 'GET')).toEqual([]);
    expect(store.getState().pendingWrite.writes).toEqual([]);
    expect(
      screen.getByText('A wallet change made before this update wasn’t kept: transactions no longer belong to wallets'),
    ).toBeTruthy();
  });
});
