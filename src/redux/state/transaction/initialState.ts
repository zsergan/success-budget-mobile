import type { ErrorResponse } from '@api/dto';
import type { TransactionModel } from '@api/models';

interface InitialState {
  transactions: TransactionModel[];
  isLoading: boolean;
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
  isCreating: boolean;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  transactions: [],
  isLoading: false,
  rangeTransactions: [],
  isLoadingRange: false,
  rangeRequestId: undefined,
  latest: undefined,
  isLoadingLatest: false,
  isCreating: false,
};

export default initialState;
