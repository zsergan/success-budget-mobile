import type { ErrorResponse } from '@api/dto';
import type { CategoryModel } from '@api/models';

interface InitialState {
  incomes: CategoryModel[];
  expenses: CategoryModel[];
  archived: CategoryModel[];
  isLoading: boolean;
  isDeleting: boolean;
  // Guards against an older fetch resolving after a newer one (e.g. a fast
  // space switch) and clobbering it — only the fulfilled/rejected action
  // matching this id is applied.
  requestId?: string;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  incomes: [],
  expenses: [],
  archived: [],
  isLoading: false,
  isDeleting: false,
};

export default initialState;
