import type { TransactionModel } from '@api/models';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import type { TransactionDraft } from './draft';
import {
  createDraft,
  defaultAssignment,
  draftFromTransaction,
  getDraftErrors,
  isDraftChanged,
  keptAssignment,
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
  category: {
    id: 4,
    name: 'Food',
    transactionType: TransactionType.EXPENSE,
    icon: 'grocery',
    color: AppColor.SLATE,
    isArchived: false,
  },
  author: { userId: 7, name: 'Zakhar', status: 'member', source: 'recorded' },
  assignment: { kind: 'member', person: { userId: 31, name: 'Lena', status: 'member' } },
};

const lena = { kind: 'member', userId: 31 } as const;
const you = { kind: 'member', userId: 7 } as const;

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
    ['1.234,5', '1234.50'],
    ["1'234.05", '1234.05'],
  ])('reads %j as %s', (input, expected) => {
    expect(normalizeAmount(input)).toBe(expected);
  });

  it.each(['', '-1', '1.234', '1,234,5', '1.2.3', '1e3', '12a', '.', '1,234.a', '1,234.5x', '1 234,5a', '1.234,-5'])(
    'rejects %j',
    (input) => {
      expect(normalizeAmount(input)).toBeNull();
    },
  );
});

describe('amount errors', () => {
  const draft = {
    ...createDraft({ transactionType: TransactionType.EXPENSE, assignment: you, timestamp: '' }),
    categoryId: 4,
  };
  const amountError = (amount: string) => getDraftErrors({ ...draft, amount }, { now: NOW }).amount;

  it('explains why a typed or pasted value is no amount, and never cuts or rounds it', () => {
    expect(amountError('')).toBe('Enter an amount');
    expect(amountError('-12')).toBe('Enter the amount without a sign: the type sets it');
    expect(amountError('12.345')).toBe('Use at most two decimal places');
    expect(amountError('12,5,0')).toBe('Use digits and one decimal separator');
    expect(amountError('1,234.a')).toBe('Use digits and one decimal separator');
    expect(amountError('1,234.567')).toBe('Use at most two decimal places');
    expect(amountError('0,00')).toBe('Enter an amount greater than zero');
    expect(amountError('0.01')).toBeUndefined();
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
    const changed = edit({ amount: '70', assignment: { kind: 'space' }, description: '' });

    expect(isDraftChanged(changed, baseline)).toBe(true);
    expect(isDraftChanged(edit({ assignment: you }), baseline)).toBe(true);
    expect(isDraftChanged({ ...changed, amount: '50.00', assignment: lena, description: 'Lunch' }, baseline)).toBe(
      false,
    );
  });
});

describe('getDraftErrors', () => {
  const fresh = createDraft({ transactionType: TransactionType.EXPENSE, assignment: you, timestamp: saved.timestamp });

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

  it("takes only a member and a category still on offer, but keeps an edit's own", () => {
    const available = { memberIds: [2], categoryIds: [5] };
    const draft = { ...fresh, amount: '5', categoryId: 4 };

    expect(getDraftErrors(draft, { now: NOW, available })).toEqual({
      assignment: 'Choose who it’s assigned to',
      category: 'Choose a category',
    });
    expect(getDraftErrors(edit({ amount: '70' }), { baseline, now: NOW, available })).toEqual({});
    expect(getDraftErrors(edit({ assignment: you }), { baseline, now: NOW, available })).toEqual({
      assignment: 'Choose who it’s assigned to',
    });
    expect(getDraftErrors(edit({ assignment: { kind: 'unassigned' } }), { baseline, now: NOW, available })).toEqual({});
  });

  it('waits for a pick after the server refused a member who had left', () => {
    expect(getDraftErrors(edit({ assignment: null }), { baseline, now: NOW })).toEqual({
      assignment: 'Choose who it’s assigned to',
    });
  });

  it('leaves values an edit does not change alone', () => {
    const legacy = { ...baseline, amount: '0.00', timestamp: new Date(NOW + 3_600_000).toISOString() };

    expect(getDraftErrors({ ...legacy, description: 'Dinner' }, { baseline: legacy, now: NOW })).toEqual({});
    expect(getDraftErrors({ ...legacy, amount: '0' }, { baseline: legacy, now: NOW })).toEqual({});
  });

  it("keeps a former member's or a deleted account's assignment only while it is unchanged", () => {
    const deleted = { ...baseline, assignment: { kind: 'member', userId: null } } as const;

    expect(
      getDraftErrors({ ...baseline, amount: '70' }, { baseline, now: NOW, available: { memberIds: [7] } }),
    ).toEqual({});
    expect(getDraftErrors({ ...deleted, amount: '70' }, { baseline: deleted, now: NOW })).toEqual({});
    expect(
      getDraftErrors({ ...baseline, assignment: { kind: 'member', userId: null } }, { baseline, now: NOW }),
    ).toEqual({ assignment: 'Choose who it’s assigned to' });
  });
});

describe('assignment defaults', () => {
  it('assigns a new transaction to the signed-in user', () => {
    expect(defaultAssignment(7)).toEqual(you);
    expect(defaultAssignment(undefined)).toEqual({ kind: 'space' });
  });

  it('repeats the last assignment for Add another while its member is still in the space', () => {
    expect(keptAssignment(lena, { userId: 7, memberIds: [7, 31] })).toEqual(lena);
    expect(keptAssignment(lena, { userId: 7 })).toEqual(lena);
    expect(keptAssignment(lena, { userId: 7, memberIds: [7] })).toEqual(you);
    expect(keptAssignment({ kind: 'unassigned' }, { userId: 7, memberIds: [7] })).toEqual({ kind: 'unassigned' });
    expect(keptAssignment(null, { userId: 7 })).toEqual(you);
  });
});

describe('requests', () => {
  it('sends the normalized values of a new transaction', () => {
    expect(toCreateRequest(edit({ amount: '12,5', description: '  ' }))).toEqual({
      assignment: { kind: 'member', user_id: 31 },
      category_id: 4,
      transaction_type: TransactionType.EXPENSE,
      amount: '12.50',
      timestamp: '2026-10-05T09:30:12.345Z',
      description: null,
    });
  });

  it("sends the whole edit, leaving a deleted account's assignment out to keep it", () => {
    expect(toUpdateRequest(edit({ assignment: { kind: 'member', userId: null } }))).not.toHaveProperty('assignment');
    expect(toUpdateRequest(edit({ assignment: { kind: 'space' } }))).toMatchObject({
      assignment: { kind: 'space' },
      amount: '50.00',
      description: 'Lunch',
    });
    expect(toUpdateRequest(baseline)).toMatchObject({ assignment: { kind: 'member', user_id: 31 } });
  });
});
