import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { CreateTransactionResult, TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import type { TransactionType } from '@shared/enums';
import { logoutMe } from '../auth/thunks';
import { spaceAccessLost, spaceSelected } from '../space/thunks';
import type { TransactionDraft } from './draft';
import { createDraft, draftFromTransaction } from './draft';

export type FlowForm = 'create' | 'edit';

export type FlowView =
  | { name: 'create'; focusAmount: boolean }
  | { name: 'details' }
  | { name: 'edit' }
  | { name: 'categories'; form: FlowForm }
  // `pending` is the date and time picked but not applied yet.
  | { name: 'dateTime'; form: FlowForm; pending: string }
  | { name: 'created' }
  // The record was deleted elsewhere.
  | { name: 'gone' };

// Creating a wallet or a category from the form hides the sheet; the draft waits here.
export type FlowAway = 'wallet' | 'category';

// Whether the record has been read again since the details opened from a list that may be behind the server.
export type FlowCheck = 'pending' | 'done' | 'failed';

// `conflict`: the record changed after it was read, so a write at its version was refused.
export type FlowNotice = 'conflict' | 'deleteFailed';

export type DeleteResult = 'deleted' | 'conflict' | 'failed' | 'stale';

export interface TransactionFlow {
  // New for every draft, so a write's key or a late answer never carries over to the next one.
  draftId: number;
  spaceId: number;
  view: FlowView;
  saved: TransactionModel | null;
  check: FlowCheck;
  notice: FlowNotice | null;
  draft: TransactionDraft | null;
  // What the draft started from; it has changes only while it differs from this.
  baseline: TransactionDraft | null;
  // A new transaction's date stays "now" until one is picked, so Add another takes the new now.
  followsNow: boolean;
  isSaving: boolean;
  // A category picked from the full list keeps its tile in the grid until the form closes.
  promotedCategoryId: number | null;
  // The last create's result, for its confirmation and Undo.
  created: CreateTransactionResult | null;
  away: FlowAway | null;
}

interface TransactionFlowState {
  flow: TransactionFlow | null;
  lastDraftId: number;
  // The wallet of the last saved transaction, per space, so a new one starts there.
  lastWalletIds: Record<number, number>;
  // Deletes waiting for the server, from the sheet or a list row; a row leaves the list only once its delete is done.
  deletingIds: string[];
}

const initialState: TransactionFlowState = { flow: null, lastDraftId: 0, lastWalletIds: {}, deletingIds: [] };

type DraftScoped<T = object> = PayloadAction<T & { draftId: number }>;

const formView = (form: FlowForm): FlowView =>
  form === 'create' ? { name: 'create', focusAmount: false } : { name: 'edit' };

const activeForm = ({ view }: TransactionFlow): FlowForm | null =>
  view.name === 'create' || view.name === 'edit'
    ? view.name
    : view.name === 'categories' || view.name === 'dateTime'
      ? view.form
      : null;

// Only the draft a late answer belongs to may take it.
const flowOf = (state: TransactionFlowState, draftId: number) => (state.flow?.draftId === draftId ? state.flow : null);

// Every user step is ignored while a write runs; only its own answer, or the session or space ending, moves on.
const idleFlow = (state: TransactionFlowState) => (state.flow && !state.flow.isSaving ? state.flow : null);

const startCreate = (
  state: TransactionFlowState,
  flow: Pick<TransactionFlow, 'spaceId'>,
  draft: Pick<TransactionDraft, 'transactionType' | 'walletId' | 'timestamp'>,
): TransactionFlow => {
  state.lastDraftId += 1;
  const fresh = createDraft(draft);

  return {
    draftId: state.lastDraftId,
    spaceId: flow.spaceId,
    view: { name: 'create', focusAmount: true },
    saved: null,
    check: 'done',
    notice: null,
    draft: fresh,
    baseline: fresh,
    followsNow: true,
    isSaving: false,
    promotedCategoryId: null,
    created: null,
    away: null,
  };
};

const transactionFlowSlice = createSlice({
  name: 'transactionFlow',
  initialState,
  reducers: {
    createOpened: (
      state,
      {
        payload,
      }: PayloadAction<{ spaceId: number; transactionType: TransactionType; walletId: number | null; now: string }>,
    ) => {
      if (state.flow) return;

      state.flow = startCreate(state, payload, { ...payload, timestamp: payload.now });
    },
    detailsOpened: (state, { payload }: PayloadAction<{ spaceId: number; transaction: TransactionModel }>) => {
      if (state.flow) return;

      state.lastDraftId += 1;
      state.flow = {
        draftId: state.lastDraftId,
        spaceId: payload.spaceId,
        view: { name: 'details' },
        saved: payload.transaction,
        check: 'pending',
        notice: null,
        draft: null,
        baseline: null,
        followsNow: false,
        isSaving: false,
        promotedCategoryId: null,
        created: null,
        away: null,
      };
    },
    checkStarted: (state, { payload }: DraftScoped) => {
      const flow = flowOf(state, payload.draftId);
      if (flow?.view.name === 'details') flow.check = 'pending';
    },
    // The details follow the server; an older answer than what they show changes nothing.
    recordChecked: (state, { payload }: DraftScoped<{ transaction: TransactionModel }>) => {
      const flow = flowOf(state, payload.draftId);
      if (flow?.view.name !== 'details' || flow.isSaving || flow.saved?.id !== payload.transaction.id) return;

      if (payload.transaction.version >= flow.saved.version) flow.saved = payload.transaction;
      flow.check = 'done';
    },
    checkFailed: (state, { payload }: DraftScoped) => {
      const flow = flowOf(state, payload.draftId);
      if (flow?.view.name === 'details' && flow.check === 'pending') flow.check = 'failed';
    },
    recordGone: (state, { payload }: DraftScoped) => {
      const flow = flowOf(state, payload.draftId);
      if (!flow?.saved) return;

      flow.view = { name: 'gone' };
      flow.isSaving = false;
      flow.notice = null;
      flow.draft = null;
      flow.baseline = null;
    },
    // A conflict keeps the draft as typed; only the user replaces it, by loading the latest version.
    writeConflicted: (state, { payload }: DraftScoped) => {
      const flow = flowOf(state, payload.draftId);
      if (!flow?.saved) return;

      flow.isSaving = false;
      flow.notice = 'conflict';
    },
    latestLoaded: (state, { payload }: DraftScoped<{ transaction: TransactionModel }>) => {
      const flow = flowOf(state, payload.draftId);
      if (!flow || flow.isSaving || flow.saved?.id !== payload.transaction.id) return;

      flow.saved = payload.transaction;
      flow.check = 'done';
      flow.notice = null;
      if (!flow.draft) return;

      state.lastDraftId += 1;
      flow.draftId = state.lastDraftId;
      flow.draft = draftFromTransaction(payload.transaction);
      flow.baseline = flow.draft;
      flow.promotedCategoryId = payload.transaction.category.id;
      flow.view = { name: 'edit' };
    },
    // Only a record read again since the details opened can be edited.
    editStarted: (state) => {
      const flow = idleFlow(state);
      if (flow?.view.name !== 'details' || flow.check !== 'done' || !flow.saved || isInitialBalance(flow.saved)) {
        return;
      }

      state.lastDraftId += 1;
      flow.draftId = state.lastDraftId;
      flow.draft = draftFromTransaction(flow.saved);
      flow.baseline = flow.draft;
      flow.promotedCategoryId = flow.saved.category.id;
      flow.notice = null;
      flow.view = { name: 'edit' };
    },
    editLeft: (state) => {
      const flow = idleFlow(state);
      if (flow?.view.name !== 'edit') return;

      flow.view = { name: 'details' };
      flow.notice = null;
      flow.draft = null;
      flow.baseline = null;
    },
    draftChanged: (state, { payload }: PayloadAction<Partial<Omit<TransactionDraft, 'timestamp'>>>) => {
      const flow = idleFlow(state);
      if (!flow?.draft || !activeForm(flow)) return;

      Object.assign(flow.draft, payload);
    },
    categoriesOpened: (state) => {
      const flow = idleFlow(state);
      if (flow?.view.name !== 'create' && flow?.view.name !== 'edit') return;

      flow.view = { name: 'categories', form: flow.view.name };
    },
    categoryPicked: (state, { payload }: PayloadAction<{ categoryId: number }>) => {
      const flow = idleFlow(state);
      if (flow?.view.name !== 'categories' || !flow.draft) return;

      flow.draft.categoryId = payload.categoryId;
      flow.promotedCategoryId = payload.categoryId;
      flow.view = formView(flow.view.form);
    },
    dateTimeOpened: (state) => {
      const flow = idleFlow(state);
      if ((flow?.view.name !== 'create' && flow?.view.name !== 'edit') || !flow.draft) return;

      flow.view = { name: 'dateTime', form: flow.view.name, pending: flow.draft.timestamp };
    },
    pendingDateChanged: (state, { payload }: PayloadAction<{ timestamp: string }>) => {
      const flow = idleFlow(state);
      if (flow?.view.name !== 'dateTime') return;

      flow.view.pending = payload.timestamp;
    },
    dateTimeApplied: (state) => {
      const flow = idleFlow(state);
      if (flow?.view.name !== 'dateTime' || !flow.draft) return;

      if (Date.parse(flow.view.pending) !== Date.parse(flow.draft.timestamp)) flow.followsNow = false;
      flow.draft.timestamp = flow.view.pending;
      flow.view = formView(flow.view.form);
    },
    // Back or Cancel from a panel: the form as it was, an unapplied date dropped.
    panelClosed: (state) => {
      const flow = idleFlow(state);
      if (flow?.view.name !== 'categories' && flow?.view.name !== 'dateTime') return;

      flow.view = formView(flow.view.form);
    },
    saveStarted: (state, { payload }: DraftScoped) => {
      const flow = flowOf(state, payload.draftId);
      if (!flow?.draft || !activeForm(flow)) return;

      flow.isSaving = true;
    },
    saveFailed: (state, { payload }: DraftScoped) => {
      const flow = flowOf(state, payload.draftId);
      if (flow) flow.isSaving = false;
    },
    createSucceeded: (state, { payload }: DraftScoped<{ result: CreateTransactionResult }>) => {
      const flow = flowOf(state, payload.draftId);
      if (!flow) return;

      flow.isSaving = false;
      flow.created = payload.result;
      if (payload.result.transaction.wallet) state.lastWalletIds[flow.spaceId] = payload.result.transaction.wallet.id;
      flow.view = { name: 'created' };
    },
    editSucceeded: (state, { payload }: DraftScoped<{ transaction: TransactionModel }>) => {
      const flow = flowOf(state, payload.draftId);
      if (!flow) return;

      flow.isSaving = false;
      if (payload.transaction.wallet) state.lastWalletIds[flow.spaceId] = payload.transaction.wallet.id;
      flow.saved = payload.transaction;
      flow.check = 'done';
      flow.draft = null;
      flow.baseline = null;
      flow.view = { name: 'details' };
    },
    // Keeps the type, the wallet and a picked date; a date that was "now" becomes the new now.
    anotherStarted: (state, { payload }: PayloadAction<{ now: string }>) => {
      const flow = idleFlow(state);
      if (flow?.view.name !== 'created' || !flow.draft) return;

      const { transactionType, walletId, timestamp } = flow.draft;
      const next = startCreate(state, flow, {
        transactionType,
        walletId,
        timestamp: flow.followsNow ? payload.now : timestamp,
      });

      state.flow = { ...next, followsNow: flow.followsNow };
    },
    // A new draft's wallet, once the space's wallets are known; it is where the form starts, not a change.
    walletDefaulted: (state, { payload }: DraftScoped<{ walletId: number | null }>) => {
      const flow = flowOf(state, payload.draftId);
      if (!flow?.draft || !flow.baseline || flow.saved || flow.isSaving) return;

      flow.draft.walletId = payload.walletId;
      flow.baseline.walletId = payload.walletId;
    },
    awayStarted: (state, { payload }: DraftScoped<{ target: FlowAway }>) => {
      const flow = flowOf(state, payload.draftId);
      if (!flow || flow.isSaving || !activeForm(flow)) return;

      flow.away = payload.target;
    },
    // The new wallet or category is saved on its own; discarding the draft later does not remove it.
    // The form comes back with awayEnded, once the wallet screen has gone.
    walletCreated: (state, { payload }: DraftScoped<{ walletId: number }>) => {
      const flow = flowOf(state, payload.draftId);
      if (flow?.away !== 'wallet' || !flow.draft) return;

      flow.draft.walletId = payload.walletId;
    },
    categoryCreated: (state, { payload }: DraftScoped<{ categoryId: number; transactionType: TransactionType }>) => {
      const flow = flowOf(state, payload.draftId);
      if (flow?.away !== 'category' || !flow.draft) return;

      if (payload.transactionType === flow.draft.transactionType) {
        flow.draft.categoryId = payload.categoryId;
        flow.promotedCategoryId = payload.categoryId;
      }

      if (flow.view.name === 'categories') flow.view = formView(flow.view.form);
      flow.away = null;
    },
    awayEnded: (state, { payload }: DraftScoped) => {
      const flow = flowOf(state, payload.draftId);
      if (flow) flow.away = null;
    },
    // The open record locks its sheet like a save does; the confirmation already showed what is deleted.
    deleteStarted: (state, { payload }: PayloadAction<{ transactionId: string }>) => {
      if (state.deletingIds.includes(payload.transactionId)) return;

      state.deletingIds.push(payload.transactionId);
      const flow = idleFlow(state);
      if (flow?.saved?.id !== payload.transactionId || (flow.view.name !== 'details' && flow.view.name !== 'edit')) {
        return;
      }

      flow.isSaving = true;
      flow.notice = null;
    },
    deleteSettled: (state, { payload }: PayloadAction<{ transactionId: string; result: DeleteResult }>) => {
      state.deletingIds = state.deletingIds.filter((id) => id !== payload.transactionId);
      const flow = state.flow;
      if (flow?.saved?.id !== payload.transactionId || !flow.isSaving) return;

      if (payload.result === 'deleted') {
        state.flow = null;
        return;
      }

      flow.isSaving = false;
      if (payload.result !== 'stale') flow.notice = payload.result === 'conflict' ? 'conflict' : 'deleteFailed';
    },
    closed: (state) => {
      if (idleFlow(state)) state.flow = null;
    },
  },
  extraReducers: (builder) => {
    // Ending the session or leaving the space ends the flow, even mid-write.
    builder.addCase(spaceSelected, (state) => {
      state.flow = null;
      state.deletingIds = [];
    });
    builder.addCase(spaceAccessLost, (state, { payload }) => {
      if (state.flow?.spaceId === payload.spaceId) state.flow = null;
      state.deletingIds = [];
    });
    builder.addCase(logoutMe.fulfilled, (state) => {
      state.flow = null;
      state.lastWalletIds = {};
      state.deletingIds = [];
    });
  },
});

export const {
  createOpened,
  detailsOpened,
  checkStarted,
  recordChecked,
  checkFailed,
  recordGone,
  writeConflicted,
  latestLoaded,
  editStarted,
  editLeft,
  draftChanged,
  categoriesOpened,
  categoryPicked,
  dateTimeOpened,
  pendingDateChanged,
  dateTimeApplied,
  panelClosed,
  saveStarted,
  saveFailed,
  createSucceeded,
  editSucceeded,
  anotherStarted,
  walletDefaulted,
  awayStarted,
  walletCreated,
  categoryCreated,
  awayEnded,
  deleteStarted,
  deleteSettled,
  closed,
} = transactionFlowSlice.actions;

export default transactionFlowSlice.reducer;
