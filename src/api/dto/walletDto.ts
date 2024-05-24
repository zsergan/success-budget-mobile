import type { Currency } from '@api/dto/profileDto';

export interface Wallet {
  id: number;
  wallet_name: string;
  balance: string;
  currency: Currency;
}

export interface GetWalletsResponse {
  wallet: Wallet;
  totalSpend: number;
  totalIncome: number;
}

export interface CreateWalletRequest {
  wallet_name: string;
  balance: number;
  currency_id: number;
}
