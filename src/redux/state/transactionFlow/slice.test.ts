import type { TransactionModel, TransactionWriteResult } from '@api/models';
import { createAppStore } from '@redux/Store';
import { logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import { hasUnsavedChanges, selectTransactionFlow } from './selectors';
import {
  anotherStarted,
  assigneeRefused,
  categoryCreated,
  categoryPicked,
  closed,
  createOpened,
  createSucceeded,
  dateApplied,
  dateOpened,
  detailsOpened,
  draftChanged,
  editLeft,
  latestLoaded,
  recordChecked,
  recordGone,
  writeConflicted,
  editStarted,
  editSucceeded,
  panelClosed,
  restoredOpened,
  todayChanged,
  pendingDatePicked,
  saveFailed,
  saveStarted,
} from './slice';

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn(() => new Promise(() => {})) }),
}));
jest.mock('expo-secure-store');

const TODAY = '2026-10-06';

const saved: TransactionModel = {
  id: 'tx-1',
  kind: TransactionKind.REGULAR,
  transactionType: TransactionType.EXPENSE,
  amount: '50.00',
  date: '2026-10-05',
  description: null,
  version: 2,
  category: {
    id: 4,
    name: 'Food',
    transactionType: TransactionType.EXPENSE,
    icon: 'grocery',
    color: AppColor.SLATE,
    isArchived: false,
  },
  author: { userId: 7, name: 'Zakhar', status: 'member', source: 'recorded' },
  assignment: { kind: 'member', person: { userId: null, name: null, status: 'deleted' } },
};

const lena = { kind: 'member', userId: 31 } as const;

const setUp = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(1));

  return { store, flow: () => selectTransactionFlow(store.getState()) };
};

const openChecked = (store: ReturnType<typeof setUp>['store'], transaction = saved) => {
  store.dispatch(detailsOpened({ spaceId: 1, transaction }));
  store.dispatch(recordChecked({ draftId: selectTransactionFlow(store.getState())!.draftId, transaction }));
};

const openCreate = (store: ReturnType<typeof setUp>['store']) =>
  store.dispatch(
    createOpened({ spaceId: 1, transactionType: TransactionType.EXPENSE, assignment: lena, today: TODAY }),
  );

describe('transaction flow', () => {
  it('opens a new transaction focused on the amount, and never a second flow over it', () => {
    const { store, flow } = setUp();

    openCreate(store);
    store.dispatch(detailsOpened({ spaceId: 1, transaction: saved }));

    expect(flow()).toMatchObject({
      view: { name: 'create', focusAmount: true },
      draft: { amount: '', assignment: lena, date: TODAY },
    });
  });

  it('takes a pick from the full list for its own draft only, and a date only with Apply', () => {
    const { store, flow } = setUp();

    openCreate(store);
    const { draftId } = flow()!;
    store.dispatch(draftChanged({ amount: '12' }));
    store.dispatch(categoryPicked({ draftId: draftId + 1, categoryId: 9 }));
    expect(flow()?.draft?.categoryId).toBeNull();
    store.dispatch(categoryPicked({ draftId, categoryId: 7 }));
    expect(flow()).toMatchObject({ view: { name: 'create' }, promotedCategoryId: 7, draft: { categoryId: 7 } });

    store.dispatch(dateOpened());
    store.dispatch(categoryPicked({ draftId, categoryId: 9 }));
    store.dispatch(pendingDatePicked({ date: '2026-10-01' }));
    store.dispatch(panelClosed());
    expect(flow()?.draft).toMatchObject({ amount: '12', categoryId: 7, date: TODAY });
    expect(flow()?.followsToday).toBe(true);

    store.dispatch(dateOpened());
    expect(flow()?.view).toEqual({ name: 'date', form: 'create', pending: TODAY });
    store.dispatch(pendingDatePicked({ date: '2026-10-01' }));
    store.dispatch(dateApplied());
    expect(flow()).toMatchObject({ view: { name: 'create' }, followsToday: false, draft: { date: '2026-10-01' } });
  });

  it('offers Edit only once the record was read again, and keeps the newest version it read', () => {
    const { store, flow } = setUp();

    store.dispatch(detailsOpened({ spaceId: 1, transaction: saved }));
    store.dispatch(editStarted());
    expect(flow()).toMatchObject({ view: { name: 'details' }, check: 'pending' });

    const { draftId } = flow()!;
    store.dispatch(recordChecked({ draftId, transaction: { ...saved, amount: '60.00', version: 3 } }));
    store.dispatch(recordChecked({ draftId, transaction: saved }));
    expect(flow()).toMatchObject({ check: 'done', saved: { amount: '60.00', version: 3 } });

    store.dispatch(editStarted());
    expect(flow()).toMatchObject({ view: { name: 'edit' }, draft: { amount: '60.00' } });
  });

  it('edits from the details, has changes only while a value differs, and goes back to the details', () => {
    const { store, flow } = setUp();

    openChecked(store);
    store.dispatch(editStarted());
    expect(flow()).toMatchObject({
      view: { name: 'edit' },
      saved: { version: 2 },
      draft: { assignment: { kind: 'member', userId: null } },
    });

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

    openChecked(store, initialBalance);
    store.dispatch(editStarted());

    expect(flow()?.view).toEqual({ name: 'details' });
  });

  it('locks every step while a write runs and takes only its own answer', () => {
    const { store, flow } = setUp();

    openCreate(store);
    const { draftId } = flow()!;

    store.dispatch(saveStarted({ draftId }));
    store.dispatch(draftChanged({ amount: '99' }));
    store.dispatch(categoryPicked({ draftId, categoryId: 7 }));
    store.dispatch(dateOpened());
    store.dispatch(closed());
    store.dispatch(saveFailed({ draftId: draftId + 1 }));
    expect(flow()).toMatchObject({ isSaving: true, view: { name: 'create' }, draft: { amount: '' } });

    store.dispatch(saveFailed({ draftId }));
    store.dispatch(closed());
    expect(flow()).toBeNull();
  });

  it('keeps the draft after a conflict until the latest version is loaded on request', () => {
    const { store, flow } = setUp();

    openChecked(store);
    store.dispatch(editStarted());
    store.dispatch(draftChanged({ amount: '70' }));
    const { draftId } = flow()!;

    store.dispatch(saveStarted({ draftId }));
    store.dispatch(writeConflicted({ draftId }));
    expect(flow()).toMatchObject({ isSaving: false, notice: 'conflict', draft: { amount: '70' } });

    store.dispatch(latestLoaded({ draftId, transaction: { ...saved, amount: '55.00', version: 4 } }));
    expect(flow()).toMatchObject({
      draftId: draftId + 1,
      view: { name: 'edit' },
      notice: null,
      saved: { version: 4 },
      draft: { amount: '55.00' },
    });
    expect(hasUnsavedChanges(flow())).toBe(false);
  });

  it('ends on its own view when the record was deleted elsewhere', () => {
    const { store, flow } = setUp();

    openChecked(store);
    store.dispatch(editStarted());
    store.dispatch(draftChanged({ amount: '70' }));
    store.dispatch(recordGone({ draftId: flow()!.draftId }));

    expect(flow()).toMatchObject({ view: { name: 'gone' }, draft: null });
    store.dispatch(closed());
    expect(flow()).toBeNull();
  });

  it('returns from a saved edit to the details with the new record', () => {
    const { store, flow } = setUp();

    openChecked(store);
    store.dispatch(editStarted());
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

  it('keeps the create result, then starts another draft on the type, the assignment given and the new now', () => {
    const { store, flow } = setUp();
    const result: TransactionWriteResult = { transaction: saved };

    openCreate(store);
    store.dispatch(draftChanged({ amount: '5', categoryId: 4, transactionType: TransactionType.INCOME }));
    const { draftId } = flow()!;

    store.dispatch(saveStarted({ draftId }));
    store.dispatch(createSucceeded({ draftId, result, now: 0 }));
    expect(flow()).toMatchObject({ view: { name: 'created' }, created: result });

    store.dispatch(anotherStarted({ today: '2026-10-07', assignment: lena }));
    expect(flow()).toMatchObject({
      draftId: draftId + 1,
      view: { name: 'create', focusAmount: true },
      created: null,
      draft: {
        transactionType: TransactionType.INCOME,
        assignment: lena,
        amount: '',
        categoryId: null,
        date: '2026-10-07',
      },
    });
  });

  it('keeps a picked date for Add another, and the selection the form opened with', () => {
    const { store, flow } = setUp();
    const selection = { fromDate: '2026-10-01', toDate: '2026-10-31' };

    store.dispatch(
      createOpened({ spaceId: 1, transactionType: TransactionType.EXPENSE, assignment: lena, today: TODAY, selection }),
    );
    store.dispatch(dateOpened());
    store.dispatch(pendingDatePicked({ date: '2026-10-01' }));
    store.dispatch(dateApplied());
    store.dispatch(draftChanged({ amount: '5', categoryId: 4, description: 'Lunch' }));
    const { draftId } = flow()!;

    store.dispatch(saveStarted({ draftId }));
    store.dispatch(createSucceeded({ draftId, result: { transaction: saved }, now: 0 }));
    expect(flow()).toMatchObject({ autoCloseAt: 5000 });

    store.dispatch(anotherStarted({ today: '2026-10-07', assignment: { kind: 'space' } }));
    expect(flow()).toMatchObject({
      draftId: draftId + 1,
      selection,
      autoCloseAt: null,
      draft: {
        date: '2026-10-01',
        amount: '',
        categoryId: null,
        description: '',
        assignment: { kind: 'space' },
      },
    });
  });

  it('takes a category created over the form for its own draft and type only', () => {
    const { store, flow } = setUp();

    openCreate(store);
    const { draftId } = flow()!;

    store.dispatch(categoryCreated({ draftId: draftId + 1, categoryId: 10, transactionType: TransactionType.EXPENSE }));
    expect(flow()?.draft?.categoryId).toBeNull();
    store.dispatch(categoryCreated({ draftId, categoryId: 11, transactionType: TransactionType.EXPENSE }));
    expect(flow()).toMatchObject({ view: { name: 'create' }, promotedCategoryId: 11, draft: { categoryId: 11 } });

    store.dispatch(categoryCreated({ draftId, categoryId: 12, transactionType: TransactionType.INCOME }));
    expect(flow()).toMatchObject({ draft: { categoryId: 11, assignment: lena } });
  });

  it('clears only the pick of a member who left during the save, until another one is picked', () => {
    const { store, flow } = setUp();

    openCreate(store);
    store.dispatch(draftChanged({ amount: '12', categoryId: 4 }));
    const { draftId } = flow()!;
    store.dispatch(saveStarted({ draftId }));
    store.dispatch(assigneeRefused({ draftId, name: 'Lena' }));

    expect(flow()).toMatchObject({
      isSaving: false,
      notice: 'assigneeLeft',
      refusal: 'Lena',
      draft: { amount: '12', categoryId: 4, assignment: null },
    });

    store.dispatch(draftChanged({ description: 'Lunch' }));
    expect(flow()?.notice).toBe('assigneeLeft');
    store.dispatch(draftChanged({ assignment: { kind: 'space' } }));
    expect(flow()).toMatchObject({ notice: null, draft: { assignment: { kind: 'space' } } });
  });

  it('starts on its assignment without counting it as a change', () => {
    const { store, flow } = setUp();

    openCreate(store);

    expect(hasUnsavedChanges(flow())).toBe(false);
    store.dispatch(draftChanged({ assignment: { kind: 'unassigned' } }));
    expect(hasUnsavedChanges(flow())).toBe(true);
  });

  it('keeps the category of an edited record in the grid', () => {
    const { store, flow } = setUp();

    openChecked(store);
    store.dispatch(editStarted());

    expect(flow()?.promotedCategoryId).toBe(4);
  });

  it('keeps a date that follows today when Apply changes nothing', () => {
    const { store, flow } = setUp();

    openCreate(store);
    store.dispatch(dateOpened());
    store.dispatch(dateApplied());

    expect(flow()?.followsToday).toBe(true);
  });

  it('moves a draft dated today by default onto the new today, as not a change of it', () => {
    const { store, flow } = setUp();

    openCreate(store);
    store.dispatch(draftChanged({ amount: '5' }));
    store.dispatch(todayChanged({ today: '2026-10-07' }));

    expect(flow()).toMatchObject({ draft: { date: '2026-10-07', amount: '5' }, baseline: { date: '2026-10-07' } });
  });

  it('never moves a picked date, an edit, a draft being saved or one whose save has an outcome to show', () => {
    const { store, flow } = setUp();

    openCreate(store);
    store.dispatch(dateOpened());
    store.dispatch(pendingDatePicked({ date: '2026-10-01' }));
    store.dispatch(dateApplied());
    store.dispatch(todayChanged({ today: '2026-10-07' }));
    expect(flow()?.draft?.date).toBe('2026-10-01');
    store.dispatch(closed());

    openChecked(store);
    store.dispatch(editStarted());
    store.dispatch(todayChanged({ today: '2026-10-07' }));
    expect(flow()?.draft?.date).toBe(saved.date);
    store.dispatch(closed());

    openCreate(store);
    const { draftId } = flow()!;
    store.dispatch(saveStarted({ draftId }));
    store.dispatch(todayChanged({ today: '2026-10-07' }));
    expect(flow()?.draft?.date).toBe(TODAY);

    store.dispatch(saveFailed({ draftId, notice: 'saveUnknown' }));
    store.dispatch(todayChanged({ today: '2026-10-07' }));
    expect(flow()?.draft?.date).toBe(TODAY);
  });

  it('keeps a restored draft’s zone until another date is applied', () => {
    const { store, flow } = setUp();
    const draft = {
      transactionType: TransactionType.EXPENSE,
      amount: '5.00',
      categoryId: 4,
      assignment: { kind: 'space' as const },
      date: '2026-09-30',
      timeZone: 'America/Chicago',
      description: '',
    };

    store.dispatch(restoredOpened({ spaceId: 1, operationId: 'op-1', draft }));
    store.dispatch(todayChanged({ today: '2026-10-07' }));
    store.dispatch(dateOpened());
    store.dispatch(dateApplied());
    expect(flow()?.draft).toEqual(draft);

    store.dispatch(dateOpened());
    store.dispatch(pendingDatePicked({ date: '2026-09-29' }));
    store.dispatch(dateApplied());
    expect(flow()?.draft).toEqual({ ...draft, date: '2026-09-29', timeZone: undefined });
  });

  it('ends on a space switch or a logout, even mid-write', async () => {
    const { store, flow } = setUp();

    openCreate(store);
    store.dispatch(saveStarted({ draftId: flow()!.draftId }));
    store.dispatch(activateSpace(2));
    expect(flow()).toBeNull();

    store.dispatch(
      createOpened({ spaceId: 2, transactionType: TransactionType.EXPENSE, assignment: lena, today: TODAY }),
    );
    store.dispatch(saveStarted({ draftId: flow()!.draftId }));
    await store.dispatch(logoutMe());
    expect(flow()).toBeNull();
  });
});
