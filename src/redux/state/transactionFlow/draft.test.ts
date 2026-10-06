import type { TransactionModel } from '@api/models';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import type { TransactionDraft } from './draft';
import {
  createDraft,
  draftFromTransaction,
  getDraftErrors,
  isDraftChanged,
  normalizeAmount,
  toCreateRequest,
  toUpdateRequest,
} from './draft';

const NOW = Date.parse('2026-10-06T12:00:00.000Z');

const saved: TransactionModel = {
  id: 'tx-1',
  kind: TransactionKind.REGULAR,
  transactionType: TransactionType.EXPENSE,
  amount: '50.00',
  timestamp: '2026-10-05T09:30:12.345Z',
  description: 'Lunch',
  version: 2,
  wallet: { id: 1, wallet_name: 'Cash', design: AppColor.SLATE },
  category: {
    id: 4,
    name: 'Food',
    transactionType: TransactionType.EXPENSE,
    icon: 'grocery',
    color: AppColor.SLATE,
    isArchived: false,
  },
};

const baseline = draftFromTransaction(saved);
const edit = (patch: Partial<TransactionDraft>) => ({ ...baseline, ...patch });

describe('normalizeAmount', () => {
  it.each([
    ['50', '50.00'],
    ['50.0', '50.00'],
    ['050,5', '50.50'],
    [' 0.01 ', '0.01'],
  ])('reads %j as %s', (input, expected) => {
    expect(normalizeAmount(input)).toBe(expected);
  });

  it.each(['', '-1', '1.234', '.5', '1e3', '12a'])('rejects %j', (input) => {
    expect(normalizeAmount(input)).toBeNull();
  });
});

describe('isDraftChanged', () => {
  it('sees no change in the same values written differently', () => {
    expect(isDraftChanged(edit({ amount: '50', description: '  Lunch ' }), baseline)).toBe(false);
    expect(isDraftChanged(edit({ timestamp: '2026-10-05T12:30:12.345+03:00' }), baseline)).toBe(false);
  });

  it('sees a change, and none once every field is back where it was', () => {
    const changed = edit({ amount: '70', walletId: 2, description: '' });

    expect(isDraftChanged(changed, baseline)).toBe(true);
    expect(isDraftChanged({ ...changed, amount: '50.00', walletId: 1, description: 'Lunch' }, baseline)).toBe(false);
  });
});

describe('getDraftErrors', () => {
  const fresh = createDraft({ transactionType: TransactionType.EXPENSE, walletId: 1, timestamp: saved.timestamp });

  it('asks a new draft for an amount above zero and a category', () => {
    expect(getDraftErrors(fresh, { now: NOW })).toEqual({ amount: 'Enter an amount', category: 'Choose a category' });
    expect(getDraftErrors({ ...fresh, amount: '0', categoryId: 4 }, { now: NOW })).toHaveProperty('amount');
    expect(getDraftErrors({ ...fresh, amount: '100000000', categoryId: 4 }, { now: NOW })).toHaveProperty('amount');
    expect(getDraftErrors({ ...fresh, amount: '99999999.99', categoryId: 4 }, { now: NOW })).toEqual({});
  });

  it('refuses a future time and a note over 140 characters', () => {
    const draft = { ...fresh, amount: '5', categoryId: 4, timestamp: new Date(NOW + 120_000).toISOString() };

    expect(getDraftErrors({ ...draft, description: '😀'.repeat(141) }, { now: NOW })).toEqual({
      timestamp: 'A transaction cannot be in the future',
      description: 'Keep the note under 140 characters',
    });
    expect(
      getDraftErrors({ ...draft, timestamp: saved.timestamp, description: '😀'.repeat(140) }, { now: NOW }),
    ).toEqual({});
  });

  it('leaves values an edit does not change alone', () => {
    const legacy = { ...baseline, amount: '0.00', timestamp: new Date(NOW + 3_600_000).toISOString() };

    expect(getDraftErrors({ ...legacy, description: 'Dinner' }, { baseline: legacy, now: NOW })).toEqual({});
    expect(getDraftErrors({ ...legacy, amount: '0' }, { baseline: legacy, now: NOW })).toEqual({});
    expect(getDraftErrors({ ...legacy, walletId: null }, { baseline: legacy, now: NOW })).toEqual({});
  });
});

describe('requests', () => {
  it('sends the normalized values of a new transaction', () => {
    expect(toCreateRequest(edit({ amount: '12,5', description: '  ' }))).toEqual({
      wallet_id: 1,
      category_id: 4,
      transaction_type: TransactionType.EXPENSE,
      amount: '12.50',
      timestamp: '2026-10-05T09:30:12.345Z',
      description: null,
    });
  });

  it('sends the whole edit, leaving the wallet out to keep a deleted one', () => {
    expect(toUpdateRequest(edit({ walletId: null }))).not.toHaveProperty('wallet_id');
    expect(toUpdateRequest(edit({ walletId: 2 }))).toMatchObject({
      wallet_id: 2,
      amount: '50.00',
      description: 'Lunch',
    });
  });
});
