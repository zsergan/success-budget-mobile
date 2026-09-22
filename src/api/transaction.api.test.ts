import { AppColor, TransactionType } from '@shared/enums';
import type { Transaction } from '@api/dto';
import { getLatestTransaction } from './transaction.api';

const mockGet = jest.fn();

jest.mock('./instance', () => ({
  ApiClient: () => ({ get: (...args: unknown[]) => mockGet(...args) }),
}));

const dto: Transaction = {
  id: 'tx-1',
  wallet_id: 1,
  category_id: 1,
  transaction_type: TransactionType.EXPENSE,
  amount: '10.00',
  timestamp: '2026-01-01T00:00:00.000Z',
  description: '',
  wallet: { id: 1, wallet_name: 'Cash', balance: '100.00', design: AppColor.SLATE },
  category: {
    id: 1,
    name: 'Food',
    transaction_type: TransactionType.EXPENSE,
    icon: 'Grocery',
    color: AppColor.SLATE,
    is_active: 1,
    transaction_count: 0,
    limit: null,
    archived_at: null,
  },
};

describe('getLatestTransaction', () => {
  beforeEach(() => mockGet.mockReset());

  it('maps a successful, non-empty response', async () => {
    mockGet.mockResolvedValue({ data: dto });

    const result = await getLatestTransaction(1);

    expect(result).toMatchObject({ id: 'tx-1', walletId: 1 });
  });

  it('returns null for a successful empty response, without calling mapTransaction on it', async () => {
    mockGet.mockResolvedValue({ data: null });

    await expect(getLatestTransaction(1)).resolves.toBeNull();
  });

  it('maps a deleted wallet (wallet: null) instead of crashing', async () => {
    mockGet.mockResolvedValue({ data: { ...dto, wallet: null } });

    const result = await getLatestTransaction(1);

    expect(result).toMatchObject({ id: 'tx-1', wallet: null });
  });

  it('propagates a real request failure instead of swallowing it as empty', async () => {
    mockGet.mockRejectedValue({ response: { status: 500 } });

    await expect(getLatestTransaction(1)).rejects.toEqual({ response: { status: 500 } });
  });
});
