import type { Currency } from './currencyDto';

export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  baseCurrency: Currency;
}
