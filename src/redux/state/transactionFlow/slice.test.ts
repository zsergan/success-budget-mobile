import type { CreateTransactionResult, TransactionModel } from '@api/models';
import { createAppStore } from '@redux/Store';
import { logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import { hasUnsavedChanges, selectTransactionFlow } from './selectors';
import {
  anotherStarted,
  awayEnded,
  awayStarted,
  categoriesOpened,
  categoryCreated,
  categoryPicked,
  closed,
  createOpened,
  createSucceeded,
  dateTimeApplied,
  dateTimeOpened,
  detailsOpened,
  draftChanged,
  editLeft,
  editStarted,
  editSucceeded,
  panelClosed,
  pendingDateChanged,
  saveFailed,
  saveStarted,
  walletCreated,
} from './slice';

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn(() => new Promise(() => {})) }),
}));
jest.mock('expo-secure-store');

const NOW = '2026-10-06T12:00:00.000Z';

const saved: TransactionModel = {
  id: 'tx-1',
  kind: TransactionKind.REGULAR,
  transactionType: TransactionType.EXPENSE,
  amount: '50.00',
  timestamp: '2026-10-05T09:30:00.000Z',
  description: null,
  version: 2,
  wallet: null,
  category: {
    id: 4,
    name: 'Food',
    transactionType: TransactionType.EXPENSE,
    icon: 'grocery',
    color: AppColor.SLATE,
    isArchived: false,
  },
};

const setUp = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(1));

  return { store, flow: () => selectTransactionFlow(store.getState()) };
};

const openCreate = (store: ReturnType<typeof setUp>['store']) =>
  store.dispatch(createOpened({ spaceId: 1, transactionType: TransactionType.EXPENSE, walletId: 3, now: NOW }));

describe('transaction flow', () => {
  it('opens a new transaction focused on the amount, and never a second flow over it', () => {
    const { store, flow } = setUp();

    openCreate(store);
    store.dispatch(detailsOpened({ spaceId: 1, transaction: saved }));

    expect(flow()).toMatchObject({
      view: { name: 'create', focusAmount: true },
      draft: { amount: '', walletId: 3, timestamp: NOW },
    });
  });

  it('keeps the draft through the categories panel and a date that is only applied with Apply', () => {
    const { store, flow } = setUp();

    openCreate(store);
    store.dispatch(draftChanged({ amount: '12' }));
    store.dispatch(categoriesOpened());
    store.dispatch(categoryPicked({ categoryId: 7 }));
    expect(flow()).toMatchObject({ view: { name: 'create', focusAmount: false }, draft: { categoryId: 7 } });

    store.dispatch(categoriesOpened());
    store.dispatch(panelClosed());
    store.dispatch(dateTimeOpened());
    store.dispatch(pendingDateChanged({ timestamp: '2026-10-01T08:00:00.000Z' }));
    store.dispatch(panelClosed());
    expect(flow()?.draft).toMatchObject({ amount: '12', categoryId: 7, timestamp: NOW });

    store.dispatch(dateTimeOpened());
    store.dispatch(pendingDateChanged({ timestamp: '2026-10-01T08:00:00.000Z' }));
    store.dispatch(dateTimeApplied());
    expect(flow()).toMatchObject({ view: { name: 'create' }, draft: { timestamp: '2026-10-01T08:00:00.000Z' } });
  });

  it('edits from the details, has changes only while a value differs, and goes back to the details', () => {
    const { store, flow } = setUp();

    store.dispatch(detailsOpened({ spaceId: 1, transaction: saved }));
    store.dispatch(editStarted({ transaction: { ...saved, version: 3 } }));
    expect(flow()).toMatchObject({ view: { name: 'edit' }, saved: { version: 3 }, draft: { walletId: null } });

    store.dispatch(draftChanged({ amount: '70' }));
    expect(hasUnsavedChanges(flow())).toBe(true);

    store.dispatch(draftChanged({ amount: '50' }));
    expect(hasUnsavedChanges(flow())).toBe(false);

    store.dispatch(editLeft());
    expect(flow()).toMatchObject({ view: { name: 'details' }, draft: null });
  });

  it('offers no edit for an initial balance', () => {
    const { store, flow } = setUp();
    const initialBalance = { ...saved, kind: TransactionKind.INITIAL_BALANCE };

    store.dispatch(detailsOpened({ spaceId: 1, transaction: initialBalance }));
    store.dispatch(editStarted({ transaction: initialBalance }));

    expect(flow()?.view).toEqual({ name: 'details' });
  });

  it('locks every step while a write runs and takes only its own answer', () => {
    const { store, flow } = setUp();

    openCreate(store);
    const { draftId } = flow()!;

    store.dispatch(saveStarted({ draftId }));
    store.dispatch(draftChanged({ amount: '99' }));
    store.dispatch(categoriesOpened());
    store.dispatch(closed());
    store.dispatch(saveFailed({ draftId: draftId + 1 }));
    expect(flow()).toMatchObject({ isSaving: true, view: { name: 'create' }, draft: { amount: '' } });

    store.dispatch(saveFailed({ draftId }));
    store.dispatch(closed());
    expect(flow()).toBeNull();
  });

  it('returns from a saved edit to the details with the new record', () => {
    const { store, flow } = setUp();

    store.dispatch(detailsOpened({ spaceId: 1, transaction: saved }));
    store.dispatch(editStarted({ transaction: saved }));
    const { draftId } = flow()!;

    store.dispatch(saveStarted({ draftId }));
    store.dispatch(editSucceeded({ draftId, transaction: { ...saved, amount: '70.00', version: 3 } }));

    expect(flow()).toMatchObject({
      view: { name: 'details' },
      isSaving: false,
      saved: { amount: '70.00' },
      draft: null,
    });
  });

  it('keeps the create result, then starts another draft on the type, wallet and the new now', () => {
    const { store, flow } = setUp();
    const result = { transaction: saved } as CreateTransactionResult;

    openCreate(store);
    store.dispatch(draftChanged({ amount: '5', categoryId: 4, transactionType: TransactionType.INCOME }));
    const { draftId } = flow()!;

    store.dispatch(saveStarted({ draftId }));
    store.dispatch(createSucceeded({ draftId, result }));
    expect(flow()).toMatchObject({ view: { name: 'created' }, created: result });

    store.dispatch(anotherStarted({ now: '2026-10-06T12:05:00.000Z' }));
    expect(flow()).toMatchObject({
      draftId: draftId + 1,
      view: { name: 'create', focusAmount: true },
      created: null,
      draft: {
        transactionType: TransactionType.INCOME,
        walletId: 3,
        amount: '',
        categoryId: null,
        timestamp: '2026-10-06T12:05:00.000Z',
      },
    });
  });

  it('returns from creating a wallet or a category with it picked, or with nothing changed', () => {
    const { store, flow } = setUp();

    openCreate(store);
    const { draftId } = flow()!;

    store.dispatch(awayStarted({ draftId, target: 'wallet' }));
    store.dispatch(walletCreated({ draftId, walletId: 9 }));
    expect(flow()).toMatchObject({ away: null, draft: { walletId: 9 } });

    store.dispatch(categoriesOpened());
    store.dispatch(awayStarted({ draftId, target: 'category' }));
    store.dispatch(categoryCreated({ draftId, categoryId: 11, transactionType: TransactionType.EXPENSE }));
    expect(flow()).toMatchObject({ away: null, view: { name: 'create' }, draft: { categoryId: 11 } });

    store.dispatch(awayStarted({ draftId, target: 'category' }));
    store.dispatch(categoryCreated({ draftId, categoryId: 12, transactionType: TransactionType.INCOME }));
    store.dispatch(awayStarted({ draftId, target: 'wallet' }));
    store.dispatch(awayEnded({ draftId }));
    expect(flow()).toMatchObject({ away: null, draft: { categoryId: 11, walletId: 9 } });
  });

  it('ends on a space switch or a logout, even mid-write', async () => {
    const { store, flow } = setUp();

    openCreate(store);
    store.dispatch(saveStarted({ draftId: flow()!.draftId }));
    store.dispatch(activateSpace(2));
    expect(flow()).toBeNull();

    store.dispatch(createOpened({ spaceId: 2, transactionType: TransactionType.EXPENSE, walletId: 1, now: NOW }));
    store.dispatch(saveStarted({ draftId: flow()!.draftId }));
    await store.dispatch(logoutMe());
    expect(flow()).toBeNull();
  });
});
