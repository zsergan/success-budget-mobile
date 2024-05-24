import type { CreateTransactionRequest, Transaction } from '@api/dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const getTransactions = async () => {
  const response = await api.get<Transaction[]>('/transactions');

  return response.data;
};

export const createTransaction = async (payload: CreateTransactionRequest) => {
  const response = await api.post<Transaction>('/transactions', payload);

  return response.data;
};
