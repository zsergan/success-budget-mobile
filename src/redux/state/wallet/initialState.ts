import type { ErrorResponse, GetWalletsResponse } from '@api/dto';

interface InitialState {
  wallets: GetWalletsResponse[];
  totalBalance: number;
  totalBalanceCurrency: string;
  deltaPercent: number;
  isLoading: boolean;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  wallets: [],
  totalBalance: 0,
  totalBalanceCurrency: '',
  deltaPercent: 0,
  isLoading: false,
};

export default initialState;
