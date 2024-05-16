export interface Currency {
  id: number;
  code: string;
  name: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  baseCurrency: Currency;
}
