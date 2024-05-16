import type { Currency } from '@api/dto/profileDto';

export interface Holding {
  id: number;
  name: string;
  balance: string;
  currency: Currency;
}

export interface GetHoldingsResponse {
  holding: Holding;
  totalSpend: number;
  totalIncome: number;
}
