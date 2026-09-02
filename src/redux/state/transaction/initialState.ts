import type { ErrorResponse, Transaction } from '@api/dto';

interface InitialState {
  transactions: Transaction[];
  isLoading: boolean;
  isCreating: boolean;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  transactions: [],
  isLoading: false,
  isCreating: false,
};

export default initialState;
