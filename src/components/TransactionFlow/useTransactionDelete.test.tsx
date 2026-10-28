import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';

import ConfirmationSheet from '@components/ConfirmationSheet/ConfirmationSheet';
import { finishDismissals, holdDismissals, resetSheets, withSheetHost } from '@components/ConfirmationSheet/testing';
import { toastCount, withToasts } from '@components/Toast/testing';

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

let mockKeys = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `key-${(mockKeys += 1)}` }));
jest.mock('expo-secure-store');
const mockedRequest = jest.fn();
jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

jest.useFakeTimers();

const lunch = mapTransaction(transactionDto({ amount: '12.00' }));

const setUp = () => {
  const store = createAppStore();
  withProfile(store);

  store.dispatch(activateSpace(1));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{withSheetHost(withToasts(children))}</Provider>
  );

  const { result } = renderHook(
    () => {
      const { lock, confirmation } = useConfirmation();
      return { ...useTransactionDelete(lock), confirmation };
    },
    { wrapper },
  );

  const confirm = async (press = result.current.confirmation!.primaryAction.onPress) => {
    await act(async () => void press());
    // Settles the delete without running the timer of the toast it shows.
    await act(() => jest.advanceTimersByTimeAsync(0));
  };

  return { result, store, confirm };
};

const deletes = () => mockedRequest.mock.calls.filter(([{ method }]) => method === 'DELETE');
const deleteKeys = () => deletes().map(([{ headers }]) => headers['Idempotency-Key']);
const refusal = (status: number, code: string) => ({
  response: { status, data: { statusCode: status, code, message: code } },
});

// Settles what the press started, without running the next toast's own timer.
const pressToastAction = async (label: string) => {
  fireEvent.press(screen.getByRole('button', { name: label }));
  await act(() => jest.advanceTimersByTimeAsync(0));
};

beforeEach(() => {
  jest.clearAllMocks();
  resetSheets();
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

  it('confirms a delete with one success toast', async () => {
    const { result, confirm } = setUp();

    mockedRequest.mockResolvedValueOnce({ data: true });
    act(() => result.current.requestDelete(lunch));
    await confirm();

    expect(screen.getByText('Transaction deleted')).toBeTruthy();
    expect(toastCount()).toBe(1);
  });

  it('says a record already gone is no longer available, not that it was deleted', async () => {
    const { result, confirm } = setUp();

    mockedRequest.mockRejectedValueOnce(refusal(404, 'TRANSACTION_NOT_FOUND'));
    act(() => result.current.requestDelete(lunch));
    await confirm();

    expect(screen.getByText('This transaction is no longer available')).toBeTruthy();
    expect(screen.queryByText('Transaction deleted')).toBeNull();
  });

  it('offers Retry after a definite failure, which deletes again without asking', async () => {
    const { result, confirm } = setUp();

    mockedRequest.mockRejectedValueOnce(refusal(400, 'TRANSACTION_IS_SYSTEM'));
    act(() => result.current.requestDelete(lunch));
    await confirm();
    expect(screen.getByText('Couldn’t delete transaction')).toBeTruthy();

    mockedRequest.mockResolvedValueOnce({ data: true });
    await pressToastAction('Retry');

    expect(result.current.confirmation).toBeNull();
    expect(deletes()).toHaveLength(2);
    expect(screen.getByText('Transaction deleted')).toBeTruthy();
    expect(toastCount()).toBe(1);
  });

  it('checks an unanswered delete with the same stored key, and keeps it on offer while still unanswered', async () => {
    const { result, store, confirm } = setUp();

    mockedRequest.mockRejectedValueOnce(new Error('Network Error'));
    act(() => result.current.requestDelete(lunch));
    await confirm();
    expect(screen.getByText('Couldn’t confirm the delete')).toBeTruthy();

    mockedRequest.mockRejectedValueOnce(new Error('Network Error'));
    await pressToastAction('Check status');
    expect(screen.getByText('Couldn’t confirm the delete')).toBeTruthy();
    expect(store.getState().pendingWrite.writes).toMatchObject([{ status: 'unknown' }]);

    // Closing the toast leaves the stored write, which the pending-writes banner keeps offering.
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await act(async () => jest.runOnlyPendingTimersAsync());
    expect(toastCount()).toBe(0);
    expect(store.getState().pendingWrite.writes).toHaveLength(1);

    mockedRequest.mockResolvedValueOnce({ data: true });
    await act(async () => result.current.retryDelete(lunch));

    expect(new Set(deleteKeys()).size).toBe(1);
    expect(screen.getByText('Transaction deleted')).toBeTruthy();
    expect(store.getState().pendingWrite.writes).toEqual([]);
  });

  it('warns when someone changed the record meanwhile, with View opening its details', async () => {
    const { result, store, confirm } = setUp();

    mockedRequest.mockRejectedValueOnce(refusal(409, 'TRANSACTION_VERSION_CONFLICT'));
    act(() => result.current.requestDelete(lunch));
    await confirm();

    expect(screen.getByText('Not deleted — this transaction changed')).toBeTruthy();
    await pressToastAction('View');

    expect(selectTransactionFlow(store.getState())).toMatchObject({
      view: { name: 'details' },
      saved: { id: lunch.id },
    });
  });

  it('takes the toast and its action away once the space or session the delete ran in is left', async () => {
    const { result, store, confirm } = setUp();

    mockedRequest.mockRejectedValueOnce(refusal(400, 'TRANSACTION_IS_SYSTEM'));
    act(() => result.current.requestDelete(lunch));
    await confirm();
    expect(screen.getByText('Couldn’t delete transaction')).toBeTruthy();

    act(() => {
      store.dispatch(activateSpace(2));
    });
    act(() => {
      store.dispatch(activateSpace(1));
    });
    await act(async () => jest.advanceTimersByTimeAsync(500));

    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    expect(deletes()).toHaveLength(1);
  });

  it('shows nothing for a delete answered after the space was left', async () => {
    const { result, store, confirm } = setUp();
    let fail: (reason: unknown) => void = () => {};

    mockedRequest.mockImplementationOnce(() => new Promise((_, reject) => (fail = reject)));
    act(() => result.current.requestDelete(lunch));
    await confirm();
    act(() => {
      store.dispatch(activateSpace(2));
    });
    await act(async () => fail(refusal(400, 'TRANSACTION_IS_SYSTEM')));

    expect(toastCount()).toBe(0);
  });
});

it('shows what the delete did only once its confirmation sheet has finished closing', async () => {
  const store = createAppStore();
  withProfile(store);
  store.dispatch(activateSpace(1));
  let requestDelete: (transaction: typeof lunch) => void = () => {};

  const Row = () => {
    const { lock, confirmation } = useConfirmation();
    const remove = useTransactionDelete(lock).requestDelete;
    requestDelete = remove;
    return <ConfirmationSheet confirmation={confirmation} />;
  };

  render(<Provider store={store}>{withSheetHost(withToasts(<Row />))}</Provider>);

  mockedRequest.mockResolvedValueOnce({ data: true });
  act(() => requestDelete(lunch));
  holdDismissals();
  fireEvent.press(screen.getByRole('button', { name: 'Delete transaction' }));
  await act(() => jest.advanceTimersByTimeAsync(0));

  expect(deletes()).toHaveLength(1);
  expect(toastCount()).toBe(0);

  finishDismissals();
  expect(screen.getByText('Transaction deleted')).toBeTruthy();
  expect(toastCount()).toBe(1);
});
