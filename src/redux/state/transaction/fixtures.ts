import type { CreateTransactionResponse, Transaction, TransactionFeedResponse } from '@api/dto';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';

const STAMPS = { created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' };

export const transactionDto = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  kind: TransactionKind.REGULAR,
  transaction_type: TransactionType.EXPENSE,
  amount: '10.00',
  timestamp: '2026-01-05T10:00:00.000Z',
  description: null,
  version: 1,
  wallet: { id: 1, wallet_name: 'Cash', design: AppColor.SLATE, ...STAMPS },
  category: {
    id: 1,
    name: 'Food',
    transaction_type: TransactionType.EXPENSE,
    icon: 'Grocery',
    color: AppColor.SLATE,
    is_active: 1,
    is_archived: false,
    ...STAMPS,
  },
  ...overrides,
});

export const createTransactionResponseDto = (overrides: Partial<Transaction> = {}): CreateTransactionResponse => ({
  transaction: transactionDto(overrides),
  wallet: { id: 1, wallet_name: 'Cash', design: AppColor.SLATE, ...STAMPS, balance: 90 },
  previous_balance: 100,
});

export const feedDto = (
  items: Transaction[],
  overrides: Partial<Omit<TransactionFeedResponse, 'items'>> = {},
): TransactionFeedResponse => ({
  items,
  page_info: { next_cursor: null, previous_cursor: null },
  summary: { count: items.length, income: '0.00', expense: '0.00' },
  day_totals: [],
  ...overrides,
});
