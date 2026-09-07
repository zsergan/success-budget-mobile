import type { AppColor } from '@shared/enums';
import type { Currency } from './currencyDto';

export interface Wallet {
  id: number;
  wallet_name: string;
  balance: string;
  currency: Currency;
  design: AppColor;
}

export interface GetWalletsResponse {
  wallet: Wallet;
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
  balance: number;
  currency_id: number;
  design: AppColor;
}

export interface UpdateWalletRequest {
  wallet_name: string;
  design: AppColor;
}
