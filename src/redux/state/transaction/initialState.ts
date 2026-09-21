import type { ErrorResponse } from '@api/dto';
import type { TransactionModel } from '@api/models';

interface InitialState {
  transactions: TransactionModel[];
  isLoading: boolean;
  // True once fetchTransactions has resolved at least once — lets useLoadInitData
  // tell the true initial load apart from a background refresh (addTransaction
  // re-dispatches fetchTransactions).
  hasLoaded: boolean;
  // Guards against an older fetch resolving after a newer one (e.g. a fast
  // space switch) and clobbering it — only the fulfilled/rejected action
  // matching this id is applied.
  requestId?: string;
  // Separate from `transactions` so the two differently-scoped fetches don't clobber each other.
  rangeTransactions: TransactionModel[];
  isLoadingRange: boolean;
  // Guards against an older range request resolving after a newer one and
  // clobbering it — only the fulfilled action matching this id is applied.
  rangeRequestId?: string;
  // undefined = not fetched yet this session, null = confirmed the account
  // has never recorded a transaction, otherwise the most recent one.
  latest: TransactionModel | null | undefined;
  isLoadingLatest: boolean;
  latestRequestId?: string;
  isCreating: boolean;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  transactions: [],
  isLoading: false,
  hasLoaded: false,
  requestId: undefined,
  rangeTransactions: [],
  isLoadingRange: false,
  rangeRequestId: undefined,
  latest: undefined,
  isLoadingLatest: false,
  latestRequestId: undefined,
  isCreating: false,
};

export default initialState;
