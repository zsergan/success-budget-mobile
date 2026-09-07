import type { ErrorResponse } from '@api/dto';
import type { CategoryModel } from '@api/models';

interface InitialState {
  incomes: CategoryModel[];
  expenses: CategoryModel[];
  archived: CategoryModel[];
  isLoading: boolean;
  isDeleting: boolean;
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
