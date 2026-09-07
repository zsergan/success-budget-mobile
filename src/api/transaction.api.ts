import type { AxiosError } from 'axios';

import type { CreateTransactionRequest, Transaction } from '@api/dto';
import { mapTransaction } from '@api/models';
import { ApiClient } from './instance';

const api = ApiClient();

export const getTransactions = async (params?: { from?: Date; to?: Date }) => {
  const response = await api.get<Transaction[]>('/transactions', {
    params: { from: params?.from?.toISOString(), to: params?.to?.toISOString() },
  });

  return response.data.map(mapTransaction);
};

export const createTransaction = async (payload: CreateTransactionRequest) => {
  const response = await api.post<Transaction>('/transactions', payload);

  return mapTransaction(response.data);
};

export const getLatestTransaction = async () => {
  try {
    const response = await api.get<Transaction>('/transactions/latest');

    return mapTransaction(response.data);
  } catch (error) {
    if ((error as AxiosError).response?.status === 404) {
      return null;
    }

    throw error;
  }
};

export const deleteTransaction = async (transactionId: string) => {
  await api.deleteRequest(`/transactions/${transactionId}`);
};
