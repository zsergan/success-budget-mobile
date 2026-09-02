import type { Currency, ErrorResponse } from '@api/dto';

interface InitialState {
  currencies: Currency[];
  isLoading: boolean;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  currencies: [],
  isLoading: false,
};

export default initialState;
