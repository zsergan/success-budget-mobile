import type { ErrorResponse, GetCategoriesResponse } from '@api/dto';

interface InitialState extends GetCategoriesResponse {
  isLoading: boolean;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  incomes: [],
  expenses: [],
  isLoading: false,
};

export default initialState;
