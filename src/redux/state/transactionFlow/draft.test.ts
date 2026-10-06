import type { TransactionModel } from '@api/models';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import type { TransactionDraft } from './draft';
import {
  createDraft,
  defaultWalletId,
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
    ['.5', '0.50'],
    ['1 234,50', '1234.50'],
    ['1,234.50', '1234.50'],
    ['1.234.567', '1234567.00'],
  ])('reads %j as %s', (input, expected) => {
    expect(normalizeAmount(input)).toBe(expected);
  });

  it.each(['', '-1', '1.234', '1,234,5', '1.2.3', '1e3', '12a', '.'])('rejects %j', (input) => {
    expect(normalizeAmount(input)).toBeNull();
  });
});

describe('amount errors', () => {
  const draft = {
    ...createDraft({ transactionType: TransactionType.EXPENSE, walletId: 1, timestamp: '' }),
    categoryId: 4,
  };
  const amountError = (amount: string) => getDraftErrors({ ...draft, amount }, { now: NOW }).amount;

  it('explains why a typed or pasted value is no amount, and never cuts or rounds it', () => {
    expect(amountError('')).toBe('Enter an amount');
    expect(amountError('-12')).toBe('Enter the amount without a sign: the type sets it');
    expect(amountError('12.345')).toBe('Use at most two decimal places');
    expect(amountError('12,5,0')).toBe('Use digits and one decimal separator');
    expect(amountError('0,00')).toBe('Enter an amount greater than zero');
    expect(amountError('100000000')).toBe('The maximum amount is 99,999,999.99');
    expect(amountError('99,999,999.99')).toBeUndefined();
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

  it('refuses a date before the first one the server stores', () => {
    const draft = { ...fresh, amount: '5', categoryId: 4, timestamp: '1970-01-01T00:00:00.000Z' };

    expect(getDraftErrors(draft, { now: NOW })).toEqual({ timestamp: 'Pick a date after 1 January 1970' });
  });

  it("takes only a wallet and a category still on offer, but keeps an edit's own", () => {
    const available = { walletIds: [2], categoryIds: [5] };
    const draft = { ...fresh, amount: '5', categoryId: 4 };

    expect(getDraftErrors(draft, { now: NOW, available })).toEqual({
      wallet: 'Choose a wallet',
      category: 'Choose a category',
    });
    expect(getDraftErrors(edit({ amount: '70' }), { baseline, now: NOW, available })).toEqual({});
    expect(getDraftErrors(edit({ walletId: 3 }), { baseline, now: NOW, available })).toEqual({
      wallet: 'Choose a wallet',
    });
  });

  it('leaves values an edit does not change alone', () => {
    const legacy = { ...baseline, amount: '0.00', timestamp: new Date(NOW + 3_600_000).toISOString() };

    expect(getDraftErrors({ ...legacy, description: 'Dinner' }, { baseline: legacy, now: NOW })).toEqual({});
    expect(getDraftErrors({ ...legacy, amount: '0' }, { baseline: legacy, now: NOW })).toEqual({});
    expect(getDraftErrors({ ...legacy, walletId: null }, { baseline: legacy, now: NOW })).toEqual({});
  });
});

describe('defaultWalletId', () => {
  it('takes the first preferred wallet still active, else the first active one', () => {
    expect(defaultWalletId([1, 2, 3], [9, 2])).toBe(2);
    expect(defaultWalletId([1, 2, 3], [null])).toBe(1);
    expect(defaultWalletId([], [2])).toBeNull();
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
