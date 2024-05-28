import type { Currency } from '@api/dto';

interface InitialState {
  currencies: Currency[];
  isLoading: boolean;
}

const initialState: InitialState = {
  currencies: [],
  isLoading: false,
};

export default initialState;
