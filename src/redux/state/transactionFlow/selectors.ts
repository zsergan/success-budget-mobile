import type { RootState } from '@redux/Store';
import { isDraftChanged } from './draft';
import type { TransactionFlow } from './slice';
import { recordIdOf } from './slice';

export const selectTransactionFlow = (state: RootState) => state.transactionFlow.flow;

// A picked but unapplied date is not a change yet, and a created draft is kept only for Add another.
export const hasUnsavedChanges = (flow: TransactionFlow | null) =>
  !!flow?.draft && !!flow.baseline && flow.view.name !== 'created' && isDraftChanged(flow.draft, flow.baseline);

// A save that may have applied, or a create that waits for the user to send it, is explained before the form closes.
export const hasOpenSave = (flow: TransactionFlow | null) =>
  flow?.notice === 'saveUnknown' || flow?.notice === 'saveExpired';

export const selectLastWalletId = (state: RootState, spaceId: number) =>
  state.transactionFlow.lastWalletIds[spaceId] ?? null;

export const selectIsDeleting = (state: RootState, transactionId: string) =>
  state.transactionFlow.deletingIds.includes(transactionId);

// Whether the open sheet waits on this delete, so it explains the outcome in place.
export const selectIsFlowDeleting = (state: RootState, transactionId: string) => {
  const { flow } = state.transactionFlow;
  return !!flow?.isSaving && recordIdOf(flow) === transactionId;
};
