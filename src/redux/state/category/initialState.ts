import type { GetCategoriesResponse } from '@api/dto';

interface InitialState extends GetCategoriesResponse {
  isLoading: boolean;
}

const initialState: InitialState = {
  incomes: [],
  expenses: [],
  isLoading: false,
};

export default initialState;
