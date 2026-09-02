import type { ErrorResponse } from '@api/dto';
import type { CategoryModel } from '@api/models';

interface InitialState {
  incomes: CategoryModel[];
  expenses: CategoryModel[];
  isLoading: boolean;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  incomes: [],
  expenses: [],
  isLoading: false,
};

export default initialState;
