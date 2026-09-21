import type { ErrorResponse, GetWalletsResponse } from '@api/dto';

interface InitialState {
  wallets: GetWalletsResponse[];
  totalBalance: number;
  totalBalanceCurrency: string;
  deltaPercent: number;
  isLoading: boolean;
  // True once fetchWallets has resolved at least once — lets useLoadInitData
  // tell the true initial load apart from a background refresh (addWallet/
  // editWallet/removeWallet all re-dispatch fetchWallets).
  hasLoaded: boolean;
  // Guards against an older fetch resolving after a newer one (e.g. a fast
  // space switch) and clobbering it — only the fulfilled/rejected action
  // matching this id is applied.
  requestId?: string;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  wallets: [],
  totalBalance: 0,
  totalBalanceCurrency: '',
  deltaPercent: 0,
  isLoading: false,
  hasLoaded: false,
};

export default initialState;
