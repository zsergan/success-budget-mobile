import type { CreateWalletRequest, UpdateWalletRequest, GetWalletsResponse, Wallet } from '@api/dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const getWallets = async () => {
  const response = await api.get<GetWalletsResponse[]>('/wallets');

  return response.data;
};

export const createWallet = async (data: CreateWalletRequest) => {
  const response = await api.post<Wallet>('/wallets', data);

  return response.data;
};

export const updateWallet = async (walletId: number, data: UpdateWalletRequest) => {
  const response = await api.put<Wallet>(`/wallets/${walletId}`, data);

  return response.data;
};

export const deleteWallet = async (walletId: number) => {
  const response = await api.deleteRequest<boolean>(`/wallets/${walletId}`);

  return response.data;
};
