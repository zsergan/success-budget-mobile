import type { ReactNode } from 'react';
import { Keyboard } from 'react-native';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { mapTransaction } from '@api/models';
import { createAppStore } from '@redux/Store';
import { activateSpace } from '@redux/state/space/thunks';
import { transactionDto } from '@redux/state/transaction/fixtures';
import { selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import {
  categoriesOpened,
  closed,
  createOpened,
  detailsOpened,
  draftChanged,
  editStarted,
  panelClosed,
  recordChecked,
} from '@redux/state/transactionFlow/slice';
import { TransactionType } from '@shared/enums';
import useFlowClose from './useFlowClose';
import useFlowConfirmation from './useFlowConfirmation';

const setUp = () => {
  const store = createAppStore();
  store.dispatch(activateSpace(1));
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const hook = renderHook(
    () => {
      const { lock, confirmation } = useFlowConfirmation();
      return { ...useFlowClose(lock), confirmation };
    },
    { wrapper },
  );
  return { ...hook, store };
};

afterEach(() => jest.restoreAllMocks());

const openDraft = (store: ReturnType<typeof createAppStore>, spaceId = 1) =>
  act(() => {
    store.dispatch(
      createOpened({ spaceId, transactionType: TransactionType.EXPENSE, walletId: 7, now: new Date().toISOString() }),
    );
    store.dispatch(draftChanged({ description: 'Unsaved' }));
  });

const openEdit = (store: ReturnType<typeof createAppStore>, spaceId = 1) =>
  act(() => {
    const transaction = mapTransaction(transactionDto());
    store.dispatch(detailsOpened({ spaceId, transaction }));
    const draftId = selectTransactionFlow(store.getState())!.draftId;
    store.dispatch(recordChecked({ draftId, transaction }));
    store.dispatch(editStarted());
    store.dispatch(draftChanged({ description: 'Keep this edit' }));
  });

it('does not discard a replacement draft when an older confirmation is accepted', () => {
  const { store, result } = setUp();
  openDraft(store);
  act(() => result.current.requestClose());
  const discard = result.current.confirmation!.primaryAction.onPress;

  act(() => {
    store.dispatch(activateSpace(2));
  });
  openDraft(store, 2);
  const replacement = selectTransactionFlow(store.getState());
  expect(result.current.confirmation).toBeNull();

  act(() => void discard());
  expect(selectTransactionFlow(store.getState())).toBe(replacement);
});

it('does not leave a replacement edit when an older Back confirmation is accepted', () => {
  const { store, result } = setUp();
  openEdit(store);
  act(() => result.current.back());
  expect(result.current.confirmation).toMatchObject({
    title: 'Discard changes?',
    primaryAction: { label: 'Discard changes', tone: 'danger' },
    secondaryAction: { label: 'Keep editing' },
  });
  const discard = result.current.confirmation!.primaryAction.onPress;

  act(() => {
    store.dispatch(activateSpace(2));
  });
  openEdit(store, 2);
  const replacement = selectTransactionFlow(store.getState());

  act(() => void discard());
  expect(selectTransactionFlow(store.getState())).toBe(replacement);
});

it.each([
  [
    'across renders',
    (store: ReturnType<typeof createAppStore>) => {
      act(() => void store.dispatch(categoriesOpened()));
      act(() => void store.dispatch(panelClosed()));
    },
  ],
  [
    'within one update',
    (store: ReturnType<typeof createAppStore>) =>
      act(() => {
        store.dispatch(categoriesOpened());
        store.dispatch(panelClosed());
      }),
  ],
])('keeps the draft when a view it left and came back to %s answers an older confirmation', (_when, roundTrip) => {
  const { store, result } = setUp();
  openDraft(store);
  act(() => result.current.requestClose());
  const discard = result.current.confirmation!.primaryAction.onPress;
  const { draftId, draft } = selectTransactionFlow(store.getState())!;

  roundTrip(store);
  expect(result.current.confirmation).toBeNull();

  act(() => void discard());
  expect(selectTransactionFlow(store.getState())).toMatchObject({ draftId, draft, view: { name: 'create' } });

  act(() => result.current.requestClose());
  expect(result.current.confirmation).toMatchObject({ title: 'Discard transaction?' });
});

it('does not close a new draft of the same space when an older confirmation is accepted', () => {
  const { store, result } = setUp();
  openDraft(store);
  act(() => result.current.requestClose());
  const discard = result.current.confirmation!.primaryAction.onPress;

  act(() => void store.dispatch(closed()));
  openDraft(store);
  const replacement = selectTransactionFlow(store.getState());
  expect(result.current.confirmation).toBeNull();

  act(() => void discard());
  expect(selectTransactionFlow(store.getState())).toBe(replacement);
});

it('asks once while a confirmation is open, and again once it closed', () => {
  const { store, result } = setUp();
  openDraft(store);

  act(() => result.current.requestClose());
  const first = result.current.confirmation;
  expect(first).toMatchObject({ title: 'Discard transaction?', primaryAction: { label: 'Discard transaction' } });

  act(() => result.current.requestClose());
  act(() => result.current.back());
  expect(result.current.confirmation).toBe(first);

  act(() => void first!.secondaryAction!.onPress());
  expect(result.current.confirmation).toBeNull();
  expect(selectTransactionFlow(store.getState())?.draft?.description).toBe('Unsaved');

  act(() => result.current.requestClose());
  const second = result.current.confirmation!;
  expect(second).not.toBe(first);

  act(() => void second.primaryAction.onPress());
  expect(selectTransactionFlow(store.getState())).toBeNull();
});

it('leaves the next flow free when one ended under an open confirmation', () => {
  const { store, result } = setUp();
  openDraft(store);
  act(() => result.current.requestClose());

  act(() => {
    store.dispatch(activateSpace(2));
  });
  openDraft(store, 2);
  expect(result.current.confirmation).toBeNull();

  act(() => result.current.requestClose());
  expect(result.current.confirmation).not.toBeNull();
});

it('asks over the keyboard only once the keyboard has gone', () => {
  let hideKeyboard: () => void = () => {};
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
  const dismissKeyboard = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  jest.spyOn(Keyboard, 'addListener').mockImplementation((event, listener) => {
    if (event === 'keyboardDidHide') hideKeyboard = () => listener({} as never);
    return { remove: () => {} } as never;
  });
  const { store, result } = setUp();
  openDraft(store);

  act(() => result.current.requestClose());
  expect(dismissKeyboard).toHaveBeenCalled();
  expect(result.current.confirmation).toBeNull();
  act(() => result.current.requestClose());

  act(() => hideKeyboard());
  expect(result.current.confirmation).toMatchObject({ title: 'Discard transaction?' });
});
