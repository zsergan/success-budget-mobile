import type { ErrorResponse } from '@api/dto';
import type { TransactionModel } from '@api/models';

interface InitialState {
  transactions: TransactionModel[];
  isLoading: boolean;
  // Transactions screen's own from/to-scoped list, kept separate from
  // `transactions` (Home's global, unfiltered list) so the two screens —
  // both kept mounted by the bottom-tab navigator — never clobber each
  // other's data with differently-scoped fetches.
  rangeTransactions: TransactionModel[];
  isLoadingRange: boolean;
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
  latest: undefined,
  isLoadingLatest: false,
  isCreating: false,
};

export default initialState;
