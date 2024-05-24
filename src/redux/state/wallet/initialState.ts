import type { GetWalletsResponse } from '@api/dto';

interface InitialState {
  wallets: GetWalletsResponse[];
  isLoading: boolean;
}

const initialState: InitialState = {
  wallets: [],
  isLoading: false,
};

export default initialState;
