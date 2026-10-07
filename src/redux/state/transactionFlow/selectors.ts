import type { RootState } from '@redux/Store';
import { isDraftChanged } from './draft';
import type { TransactionFlow } from './slice';

export const selectTransactionFlow = (state: RootState) => state.transactionFlow.flow;

// A picked but unapplied date is not a change yet, and a created draft is kept only for Add another.
export const hasUnsavedChanges = (flow: TransactionFlow | null) =>
  !!flow?.draft && !!flow.baseline && flow.view.name !== 'created' && isDraftChanged(flow.draft, flow.baseline);

export const selectLastWalletId = (state: RootState, spaceId: number) =>
  state.transactionFlow.lastWalletIds[spaceId] ?? null;

export const selectIsDeleting = (state: RootState, transactionId: string) =>
  state.transactionFlow.deletingIds.includes(transactionId);
