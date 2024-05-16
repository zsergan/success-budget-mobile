import type { GetHoldingsResponse } from '@api/dto';

interface InitialState {
  holdings: GetHoldingsResponse[];
  isLoading: boolean;
}

const initialState: InitialState = {
  holdings: [],
  isLoading: false,
};

export default initialState;
