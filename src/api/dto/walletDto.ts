import type { WalletDesign } from '@shared/enums';
import type { Currency } from './currencyDto';

export interface Wallet {
  id: number;
  wallet_name: string;
  balance: string;
  currency: Currency;
  design: WalletDesign;
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
  design: WalletDesign;
}

export interface UpdateWalletRequest {
  wallet_name: string;
  design: WalletDesign;
}
