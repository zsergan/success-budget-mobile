import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { mapTransaction } from '@api/models';
import { createAppStore } from '@redux/Store';
import { activateSpace } from '@redux/state/space/thunks';
import { transactionDto } from '@redux/state/transaction/fixtures';
import { selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import {
  createOpened,
  detailsOpened,
  draftChanged,
  editStarted,
  recordChecked,
} from '@redux/state/transactionFlow/slice';
import { TransactionType } from '@shared/enums';
import useConfirmLock from './useConfirmLock';
import useFlowClose from './useFlowClose';

const setUp = () => {
  const store = createAppStore();
  store.dispatch(activateSpace(1));
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const hook = renderHook(() => useFlowClose(useConfirmLock()), { wrapper });
  return { ...hook, store };
};

beforeEach(() => jest.spyOn(Alert, 'alert').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

it('does not discard a replacement draft when an older confirmation is accepted', () => {
  const { store, result } = setUp();
  const open = (spaceId: number) => {
    store.dispatch(
      createOpened({ spaceId, transactionType: TransactionType.EXPENSE, walletId: 7, now: new Date().toISOString() }),
    );
    store.dispatch(draftChanged({ description: 'Keep this draft' }));
  };
  open(1);
  act(() => result.current.requestClose());
  const discard = (Alert.alert as jest.Mock).mock.calls[0][2][0].onPress;
  store.dispatch(activateSpace(2));
  open(2);
  const replacement = selectTransactionFlow(store.getState());
  act(discard);
  expect(selectTransactionFlow(store.getState())).toBe(replacement);
});

it('does not leave a replacement edit when an older Back confirmation is accepted', () => {
  const { store, result } = setUp();
  const open = (spaceId: number) => {
    const transaction = mapTransaction(transactionDto());
    store.dispatch(detailsOpened({ spaceId, transaction }));
    const draftId = selectTransactionFlow(store.getState())!.draftId;
    store.dispatch(recordChecked({ draftId, transaction }));
    store.dispatch(editStarted());
    store.dispatch(draftChanged({ description: 'Keep this edit' }));
  };
  open(1);
  act(() => result.current.back());
  const discard = (Alert.alert as jest.Mock).mock.calls[0][2][0].onPress;
  store.dispatch(activateSpace(2));
  open(2);
  const replacement = selectTransactionFlow(store.getState());
  act(discard);
  expect(selectTransactionFlow(store.getState())).toBe(replacement);
});

const openDraft = (store: ReturnType<typeof createAppStore>, spaceId = 1) => {
  store.dispatch(
    createOpened({ spaceId, transactionType: TransactionType.EXPENSE, walletId: 7, now: new Date().toISOString() }),
  );
  store.dispatch(draftChanged({ description: 'Unsaved' }));
};

const lastButtons = () => (Alert.alert as jest.Mock).mock.calls.at(-1)[2];

it('asks once while a confirmation is open, and again once it closed', () => {
  const { store, result } = setUp();
  openDraft(store);

  act(() => result.current.requestClose());
  act(() => result.current.requestClose());
  act(() => result.current.back());
  expect(Alert.alert).toHaveBeenCalledTimes(1);

  act(() => lastButtons()[1].onPress());
  act(() => result.current.requestClose());

  expect(Alert.alert).toHaveBeenCalledTimes(2);
  act(() => lastButtons()[0].onPress());
  expect(selectTransactionFlow(store.getState())).toBeNull();
});

it('leaves the next flow free when one ended under an open confirmation', () => {
  const { store, result } = setUp();
  openDraft(store);
  act(() => result.current.requestClose());

  store.dispatch(activateSpace(2));
  openDraft(store, 2);
  act(() => result.current.requestClose());

  expect(Alert.alert).toHaveBeenCalledTimes(2);
});
