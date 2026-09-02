import type { ErrorResponse, GetWalletsResponse } from '@api/dto';

interface InitialState {
  wallets: GetWalletsResponse[];
  isLoading: boolean;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  wallets: [],
  isLoading: false,
};

export default initialState;
