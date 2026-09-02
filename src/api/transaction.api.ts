import type { CreateTransactionRequest, Transaction } from '@api/dto';
import { mapTransaction } from '@api/models';
import { ApiClient } from './instance';

const api = ApiClient();

export const getTransactions = async () => {
  const response = await api.get<Transaction[]>('/transactions');

  return response.data.map(mapTransaction);
};

export const createTransaction = async (payload: CreateTransactionRequest) => {
  const response = await api.post<Transaction>('/transactions', payload);

  return mapTransaction(response.data);
};
