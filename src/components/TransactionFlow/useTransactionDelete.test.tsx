import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { mapTransaction } from '@api/models';
import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import { selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import { transactionDto } from '@redux/state/transaction/fixtures';
import { TransactionKind } from '@shared/enums';
import useConfirmation from '@hooks/useConfirmation';
import useTransactionDelete from './useTransactionDelete';

const mockAddAlert = jest.fn();
jest.mock('@hooks/useAlert', () => () => ({ addAlert: mockAddAlert }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'key-1' }));
jest.mock('expo-secure-store');
const mockedRequest = jest.fn();
jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

jest.useFakeTimers();

const lunch = mapTransaction(transactionDto({ amount: '12.00' }));

const setUp = () => {
  const store = createAppStore();
  withProfile(store);

  store.dispatch(activateSpace(1));
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  const { result } = renderHook(
    () => {
      const { lock, confirmation } = useConfirmation();
      return { ...useTransactionDelete(lock), confirmation };
    },
    { wrapper },
  );

  const confirm = async (press = result.current.confirmation!.primaryAction.onPress) => {
    await act(async () => void press());
    await act(async () => jest.runOnlyPendingTimersAsync());
  };

  return { result, store, confirm };
};

const deletes = () => mockedRequest.mock.calls.filter(([{ method }]) => method === 'DELETE');

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequest.mockImplementation(() => new Promise(() => {}));
});

describe('useTransactionDelete from a list row', () => {
  it('asks with the record named, and does not accept the answer from a previous login', async () => {
    const { result, store, confirm } = setUp();
    act(() => result.current.requestDelete(lunch));
    expect(result.current.confirmation).toMatchObject({
      title: 'Delete transaction?',
      description: '-12.00 · Food · Cash. The wallet balance will be adjusted.',
      primaryAction: { label: 'Delete transaction', tone: 'danger' },
    });
    const press = result.current.confirmation!.primaryAction.onPress;

    act(() => {
      store.dispatch(logoutMe.fulfilled(undefined, 'logout', undefined));
      withProfile(store);
      store.dispatch(activateSpace(1));
    });
    expect(result.current.confirmation).toBeNull();

    await confirm(press);
    expect(deletes()).toHaveLength(0);
  });

  it('slides the row back on Cancel and sends nothing', () => {
    const { result } = setUp();
    const onSettled = jest.fn();

    act(() => result.current.requestDelete(lunch, onSettled));
    act(() => result.current.confirmation!.onCancel());

    expect(onSettled).toHaveBeenCalled();
    expect(result.current.confirmation).toBeNull();
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it('deletes once however often the confirmation is pressed', async () => {
    const { result, confirm } = setUp();
    act(() => result.current.requestDelete(lunch));
    const press = result.current.confirmation!.primaryAction.onPress;

    await confirm(press);
    await confirm(press);

    expect(deletes()).toHaveLength(1);
  });

  it('asks one row at a time, sliding back a row that asked meanwhile', () => {
    const { result } = setUp();
    const other = jest.fn();

    act(() => result.current.requestDelete(lunch));
    const first = result.current.confirmation;
    act(() => result.current.requestDelete(lunch, other));

    expect(result.current.confirmation).toBe(first);
    expect(other).toHaveBeenCalled();
  });

  it('asks nothing for the initial balance, sliding the row back', () => {
    const { result } = setUp();
    const onSettled = jest.fn();

    act(() => result.current.requestDelete({ ...lunch, kind: TransactionKind.INITIAL_BALANCE }, onSettled));

    expect(result.current.confirmation).toBeNull();
    expect(onSettled).toHaveBeenCalled();
  });

  it('offers Retry after a failure, which deletes again without asking', async () => {
    const { result, confirm } = setUp();

    mockedRequest.mockRejectedValueOnce(new Error('Network Error'));
    act(() => result.current.requestDelete(lunch));
    await confirm();

    const [message, action] = mockAddAlert.mock.calls[0];
    expect(message).toBe('Couldn’t confirm the delete');

    mockedRequest.mockResolvedValueOnce({ data: true });
    await act(async () => action.onPress());
    await act(async () => jest.runOnlyPendingTimersAsync());

    expect(result.current.confirmation).toBeNull();
    expect(deletes()).toHaveLength(2);
    expect(mockAddAlert).toHaveBeenLastCalledWith('Transaction deleted');
  });

  it('offers to open the details when someone changed the record meanwhile', async () => {
    const { result, confirm } = setUp();

    mockedRequest.mockRejectedValueOnce({
      response: { status: 409, data: { statusCode: 409, code: 'TRANSACTION_VERSION_CONFLICT', message: 'Conflict' } },
    });
    act(() => result.current.requestDelete(lunch));
    await confirm();

    expect(mockAddAlert).toHaveBeenCalledWith('This transaction was changed by someone else', {
      label: 'Open',
      onPress: expect.any(Function),
    });
  });

  it('lets Retry and Open act only in the space and session the delete ran in', async () => {
    const { result, store, confirm } = setUp();

    mockedRequest.mockRejectedValueOnce(new Error('Network Error')).mockRejectedValueOnce({
      response: { status: 409, data: { statusCode: 409, code: 'TRANSACTION_VERSION_CONFLICT', message: 'Conflict' } },
    });
    act(() => result.current.requestDelete(lunch));
    await confirm();
    act(() => result.current.requestDelete(lunch));
    await confirm();

    const [[, retry], [, open]] = mockAddAlert.mock.calls;
    act(() => {
      store.dispatch(activateSpace(2));
    });
    await act(async () => retry.onPress());
    act(() => open.onPress());

    expect(deletes()).toHaveLength(2);
    expect(selectTransactionFlow(store.getState())).toBeNull();
  });
});
