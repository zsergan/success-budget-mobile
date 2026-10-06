import type { RootState } from '@redux/Store';
import { isDraftChanged } from './draft';
import type { TransactionFlow } from './slice';

export const selectTransactionFlow = (state: RootState) => state.transactionFlow.flow;

// A picked but unapplied date is not a change yet.
export const hasUnsavedChanges = (flow: TransactionFlow | null) =>
  !!flow?.draft && !!flow.baseline && isDraftChanged(flow.draft, flow.baseline);
