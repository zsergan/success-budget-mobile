import type { CreateTransactionRequest, CreateTransactionResponse, Transaction } from '@api/dto';
import { mapTransaction } from '@api/models';
import { ApiClient } from './instance';

const api = ApiClient();

export const getTransactions = async (spaceId: number, params?: { from?: Date; to?: Date }) => {
  const response = await api.get<Transaction[]>(`/spaces/${spaceId}/transactions`, {
    params: { from: params?.from?.toISOString(), to: params?.to?.toISOString() },
  });

  return response.data.map(mapTransaction);
};

export const createTransaction = async (spaceId: number, payload: CreateTransactionRequest) => {
  const response = await api.post<CreateTransactionResponse>(`/spaces/${spaceId}/transactions`, payload);

  return response.data;
};

export const getLatestTransaction = async (spaceId: number) => {
  const response = await api.get<Transaction | null>(`/spaces/${spaceId}/transactions/latest`);

  return response.data ? mapTransaction(response.data) : null;
};

export const deleteTransaction = async (spaceId: number, transactionId: string) => {
  await api.deleteRequest(`/spaces/${spaceId}/transactions/${transactionId}`);
};
