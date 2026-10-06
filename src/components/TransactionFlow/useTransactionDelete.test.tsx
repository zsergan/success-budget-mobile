import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { mapTransaction } from '@api/models';
import { createAppStore } from '@redux/Store';
import { activateSpace } from '@redux/state/space/thunks';
import { transactionDto } from '@redux/state/transaction/fixtures';
import useTransactionDelete from './useTransactionDelete';

const mockAddAlert = jest.fn();
jest.mock('@hooks/useAlert', () => () => ({ addAlert: mockAddAlert }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'key-1' }));
jest.mock('expo-secure-store');
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockedRequest = jest.fn();
jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

jest.useFakeTimers();

const lunch = mapTransaction(transactionDto({ amount: '12.00' }));

const setUp = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(1));
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  return renderHook(() => useTransactionDelete(), { wrapper }).result;
};

const confirm = async (index = 0) => {
  await act(async () => (Alert.alert as jest.Mock).mock.calls[index][2][0].onPress());
  await act(async () => jest.runOnlyPendingTimersAsync());
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert');
  mockedRequest.mockImplementation(() => new Promise(() => {}));
});

describe('useTransactionDelete from a list row', () => {
  it('slides the row back on Cancel and sends nothing', () => {
    const result = setUp();
    const onSettled = jest.fn();

    result.current.requestDelete(lunch, onSettled);
    (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress();

    expect(onSettled).toHaveBeenCalled();
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it('offers Retry after a failure, which deletes again without asking', async () => {
    const result = setUp();

    mockedRequest.mockRejectedValueOnce(new Error('Network Error'));
    result.current.requestDelete(lunch);
    await confirm();

    const [message, action] = mockAddAlert.mock.calls[0];
    expect(message).toBe('Couldn’t delete transaction');

    mockedRequest.mockResolvedValueOnce({ data: true });
    await act(async () => action.onPress());
    await act(async () => jest.runOnlyPendingTimersAsync());

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(mockedRequest.mock.calls.filter(([{ method }]) => method === 'DELETE')).toHaveLength(2);
    expect(mockAddAlert).toHaveBeenLastCalledWith('Transaction deleted');
  });

  it('offers to open the details when someone changed the record meanwhile', async () => {
    const result = setUp();

    mockedRequest.mockRejectedValueOnce({
      response: { data: { statusCode: 409, code: 'TRANSACTION_VERSION_CONFLICT', message: 'Conflict' } },
    });
    result.current.requestDelete(lunch);
    await confirm();

    expect(mockAddAlert).toHaveBeenCalledWith('This transaction was changed by someone else', {
      label: 'Open',
      onPress: expect.any(Function),
    });
  });
});
