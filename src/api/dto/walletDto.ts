import type { AppColor, TransactionType } from '@shared/enums';

export interface Wallet {
  id: number;
  wallet_name: string;
  design: AppColor;
}

// `balance` is computed per response (all-time, from history), never stored.
export interface WalletWithBalance extends Wallet {
  balance: number;
}

export interface GetWalletsResponse {
  wallet: WalletWithBalance;
  total_spend: number;
  total_income: number;
}

export interface WalletsOverviewResponse {
  total_balance: number;
  total_balance_currency: string;
  delta_percent: number;
  wallets: GetWalletsResponse[];
}

export interface CreateWalletRequest {
  wallet_name: string;
  initial_balance: string;
  design: AppColor;
}

// The starting-balance transaction, saved without relations; unlike history reads its amount is a number.
export interface InitialBalanceTransaction {
  id: string;
  transaction_type: TransactionType;
  amount: number;
  timestamp: string;
  description: string | null;
}

export interface CreateWalletResponse {
  wallet: WalletWithBalance;
  transaction: InitialBalanceTransaction | null;
}

export interface UpdateWalletRequest {
  wallet_name: string;
  design: AppColor;
}
