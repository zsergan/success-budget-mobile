export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  base_currency_id: number;
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}
