import type { ErrorResponse } from '@api/dto';
import type { TransactionModel } from '@api/models';

interface InitialState {
  transactions: TransactionModel[];
  isLoading: boolean;
  // Separate from `transactions` (Home's global list) so the two
  // differently-scoped fetches, both from screens the tab navigator keeps
  // mounted, don't clobber each other.
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
