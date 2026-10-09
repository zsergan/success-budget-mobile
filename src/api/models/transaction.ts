import type { AppColor, TransactionType } from '@shared/enums';
import { TransactionKind } from '@shared/enums';
import type { IconType } from '@shared/types';
import type {
  CreateTransactionResponse,
  Transaction,
  TransactionCategory,
  UpdateTransactionResponse,
  Wallet,
  WalletWithBalance,
} from '@api/dto';

import { toMobileIcon } from './category';

export interface TransactionCategoryModel {
  id: number;
  name: string;
  transactionType: TransactionType;
  icon: IconType;
  color: AppColor;
  isArchived: boolean;
}

export interface TransactionModel {
  id: string;
  kind: TransactionKind;
  transactionType: TransactionType;
  amount: string;
  timestamp: string;
  description: string | null;
  version: number;
  // null once the wallet is deleted.
  wallet: Wallet | null;
  category: TransactionCategoryModel;
}

export interface CreateTransactionResult {
  transaction: TransactionModel;
  wallet: WalletWithBalance;
  previousBalance: number;
}

export interface UpdateTransactionResult {
  transaction: TransactionModel;
  wallets: { id: number; balance: number; isDeleted: boolean }[];
}

export const mapTransactionCategory = (dto: TransactionCategory): TransactionCategoryModel => ({
  id: dto.id,
  name: dto.name,
  transactionType: dto.transaction_type,
  icon: toMobileIcon(dto.icon),
  color: dto.color,
  isArchived: dto.is_archived,
});

export const mapTransaction = (dto: Transaction): TransactionModel => ({
  id: dto.id,
  kind: dto.kind,
  transactionType: dto.transaction_type,
  amount: dto.amount,
  timestamp: dto.timestamp,
  description: dto.description,
  version: dto.version,
  wallet: dto.wallet && { id: dto.wallet.id, wallet_name: dto.wallet.wallet_name, design: dto.wallet.design },
  category: mapTransactionCategory(dto.category),
});

export const mapCreateTransactionResponse = (dto: CreateTransactionResponse): CreateTransactionResult => ({
  transaction: mapTransaction(dto.transaction),
  wallet: {
    id: dto.wallet.id,
    wallet_name: dto.wallet.wallet_name,
    design: dto.wallet.design,
    balance: dto.wallet.balance,
  },
  previousBalance: dto.previous_balance,
});

export const mapUpdateTransactionResponse = (dto: UpdateTransactionResponse): UpdateTransactionResult => ({
  transaction: mapTransaction(dto.transaction),
  wallets: dto.wallets.map(({ id, balance, is_deleted }) => ({ id, balance, isDeleted: is_deleted })),
});

// The starting balance is read-only: no edit, no delete, and it is not income.
export const isInitialBalance = (transaction: Pick<TransactionModel, 'kind'>) =>
  transaction.kind === TransactionKind.INITIAL_BALANCE;
