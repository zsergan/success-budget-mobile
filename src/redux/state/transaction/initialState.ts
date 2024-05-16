import type { Transaction } from '@api/dto';

interface InitialState {
  transactions: Transaction[];
  isLoading: boolean;
  isCreating: boolean;
}

const initialState: InitialState = {
  transactions: [],
  isLoading: false,
  isCreating: false,
};

export default initialState;
