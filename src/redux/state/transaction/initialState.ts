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
  error?: ErrorResponse;
  // Separate from `transactions` so the two differently-scoped fetches don't clobber each other.
  rangeTransactions: TransactionModel[];
  isLoadingRange: boolean;
  // Guards against an older range request resolving after a newer one and
  // clobbering it — only the fulfilled action matching this id is applied.
  rangeRequestId?: string;
  // The `from|to` key of the range currently loaded into rangeTransactions
  // (or of the request in flight, once its pending clears stale rows) --
  // lets pending tell "a genuinely new period" (clear immediately) from "a
  // background refresh of the same one" (keep showing what's there).
  rangeQueryKey?: string;
  rangeError?: ErrorResponse;
  // undefined = not fetched yet this session, null = confirmed the account
  // has never recorded a transaction, otherwise the most recent one.
  latest: TransactionModel | null | undefined;
  isLoadingLatest: boolean;
  latestRequestId?: string;
  latestError?: ErrorResponse;
  isCreating: boolean;
  // Bumped on every successful addTransaction (from any screen) or other
  // mutation that changes history (e.g. a wallet created with a starting
  // balance), for the space it actually ran against. useTransactionsData
  // watches this to refetch the currently active range even when the
  // mutation didn't originate on the Transactions screen.
  dataRevision: number;
  // The space.contextKey this slice's data currently belongs to -- lets a
  // mutation thunk that captured its own contextKey before the request
  // decide, after the await, whether it's still relevant.
  contextKey: number;
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
  dataRevision: 0,
  contextKey: 0,
};

export default initialState;
