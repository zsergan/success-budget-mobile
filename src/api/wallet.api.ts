import type {
  CreateWalletRequest,
  UpdateWalletRequest,
  WalletsOverviewResponse,
  CreateWalletResponse,
  Wallet,
} from '@api/dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const getWallets = async (spaceId: number) => {
  const response = await api.get<WalletsOverviewResponse>(`/spaces/${spaceId}/wallets`);

  return response.data;
};

export const createWallet = async (spaceId: number, data: CreateWalletRequest) => {
  const response = await api.post<CreateWalletResponse>(`/spaces/${spaceId}/wallets`, data);

  return response.data;
};

export const updateWallet = async (spaceId: number, walletId: number, data: UpdateWalletRequest) => {
  const response = await api.put<Wallet>(`/spaces/${spaceId}/wallets/${walletId}`, data);

  return response.data;
};

export const deleteWallet = async (spaceId: number, walletId: number) => {
  const response = await api.deleteRequest<boolean>(`/spaces/${spaceId}/wallets/${walletId}`);

  return response.data;
};
