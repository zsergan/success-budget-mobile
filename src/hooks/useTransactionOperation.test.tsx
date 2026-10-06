import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import { activateSpace } from '@redux/state/space/thunks';
import { createTransactionResponseDto } from '@redux/state/transaction/fixtures';
import type { TransactionRequest } from '@redux/state/transaction/operations';
import { TransactionType } from '@shared/enums';
import useTransactionOperation from './useTransactionOperation';

const mockedRequest = jest.fn();
let mockKeys = 0;

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

jest.mock('expo-crypto', () => ({ randomUUID: () => `key-${++mockKeys}` }));

jest.useFakeTimers();

const request: TransactionRequest & { type: 'create' } = {
  type: 'create',
  spaceId: 1,
  data: {
    wallet_id: 1,
    category_id: 1,
    transaction_type: TransactionType.EXPENSE,
    amount: '10',
    timestamp: '2026-01-05T10:00:00.000Z',
  },
};

const keysSent = () =>
  mockedRequest.mock.calls.map(([{ headers }]: [{ headers: Record<string, string> }]) => headers['Idempotency-Key']);

const renderOperation = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(1));

  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  return renderHook(() => useTransactionOperation(), { wrapper: Wrapper }).result;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockKeys = 0;
});

it('sends one write for two taps in the same frame and ignores the second', async () => {
  const result = renderOperation();

  mockedRequest.mockResolvedValue({ data: createTransactionResponseDto() });

  const outcomes = await act(() => Promise.all([result.current.submit(request), result.current.submit(request)]));

  expect(mockedRequest).toHaveBeenCalledTimes(1);
  expect(outcomes.map(({ status }) => status)).toEqual(['succeeded', 'ignored']);
  expect(result.current.isRunning).toBe(false);
});

it('retries an unanswered save with its key, and gives the next draft a new one after reset', async () => {
  const result = renderOperation();

  mockedRequest
    .mockRejectedValueOnce(new Error('Network Error'))
    .mockResolvedValue({ data: createTransactionResponseDto() });

  expect(await act(() => result.current.submit(request))).toMatchObject({ failure: { kind: 'uncertain' } });
  expect(await act(() => result.current.retry())).toMatchObject({ status: 'succeeded' });

  act(() => result.current.reset());
  await act(() => result.current.submit(request));

  expect(keysSent()).toEqual(['key-1', 'key-1', 'key-2']);
});
