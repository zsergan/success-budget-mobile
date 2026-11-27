import type { TransactionModel } from '@api/models';
import { AppColor, SpaceType, TransactionKind, TransactionType } from '@shared/enums';
import type { TransactionDraft } from './draft';
import {
  createDraft,
  defaultAssignment,
  draftFromCreateRequest,
  draftFromTransaction,
  getDraftErrors,
  isDraftChanged,
  keptAssignment,
  normalizeAmount,
  toCreateRequest,
  toUpdateRequest,
} from './draft';

const TODAY = '2026-10-06';
const DEVICE_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const saved: TransactionModel = {
  id: 'tx-1',
  kind: TransactionKind.REGULAR,
  transactionType: TransactionType.EXPENSE,
  amount: '50.00',
  date: '2026-10-05',
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
    ...createDraft({ transactionType: TransactionType.EXPENSE, assignment: you, date: TODAY }),
    categoryId: 4,
  };
  const amountError = (amount: string) => getDraftErrors({ ...draft, amount }, { today: TODAY }).amount;

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
    expect(isDraftChanged(edit({ timeZone: 'Asia/Tokyo' }), baseline)).toBe(false);
  });

  it('sees another date as a change', () => {
    expect(isDraftChanged(edit({ date: '2026-10-04' }), baseline)).toBe(true);
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
  const fresh = createDraft({ transactionType: TransactionType.EXPENSE, assignment: you, date: saved.date });

  it('asks a new draft for an amount above zero and a category', () => {
    expect(getDraftErrors(fresh, { today: TODAY })).toEqual({
      amount: 'Enter an amount',
      category: 'Choose a category',
    });
    expect(getDraftErrors({ ...fresh, amount: '0', categoryId: 4 }, { today: TODAY })).toHaveProperty('amount');
    expect(getDraftErrors({ ...fresh, amount: '100000000', categoryId: 4 }, { today: TODAY })).toHaveProperty('amount');
    expect(getDraftErrors({ ...fresh, amount: '99999999.99', categoryId: 4 }, { today: TODAY })).toEqual({});
  });

  it('refuses a date after today and a note over 140 characters, and takes today itself', () => {
    const draft = { ...fresh, amount: '5', categoryId: 4, date: '2026-10-07' };

    expect(getDraftErrors({ ...draft, description: '😀'.repeat(141) }, { today: TODAY })).toEqual({
      date: 'Pick today or an earlier day',
      description: 'Keep the note under 140 characters',
    });
    expect(getDraftErrors({ ...draft, date: TODAY, description: '😀'.repeat(140) }, { today: TODAY })).toEqual({});
  });

  it('takes any earlier day, the first one the server stores included, and nothing that is not a date', () => {
    const draft = { ...fresh, amount: '5', categoryId: 4 };

    expect(getDraftErrors({ ...draft, date: '1000-01-01' }, { today: TODAY })).toEqual({});
    expect(getDraftErrors({ ...draft, date: '1969-12-31' }, { today: TODAY })).toEqual({});
    expect(getDraftErrors({ ...draft, date: '2026-02-30' }, { today: TODAY })).toEqual({ date: 'Pick a date' });
    expect(getDraftErrors({ ...draft, date: '0999-12-31' }, { today: TODAY })).toEqual({ date: 'Pick a date' });
  });

  it("takes only a member and a category still on offer, but keeps an edit's own", () => {
    const available = { memberIds: [2], categoryIds: [5] };
    const draft = { ...fresh, amount: '5', categoryId: 4 };

    expect(getDraftErrors(draft, { today: TODAY, available })).toEqual({
      assignment: 'Choose who it’s assigned to',
      category: 'Choose a category',
    });
    expect(getDraftErrors(edit({ amount: '70' }), { baseline, today: TODAY, available })).toEqual({});
    expect(getDraftErrors(edit({ assignment: you }), { baseline, today: TODAY, available })).toEqual({
      assignment: 'Choose who it’s assigned to',
    });
    expect(getDraftErrors(edit({ assignment: { kind: 'unassigned' } }), { baseline, today: TODAY, available })).toEqual(
      {},
    );
  });

  it('waits for a pick after the server refused a member who had left', () => {
    expect(getDraftErrors(edit({ assignment: null }), { baseline, today: TODAY })).toEqual({
      assignment: 'Choose who it’s assigned to',
    });
  });

  it('leaves values an edit does not change alone', () => {
    const legacy = { ...baseline, amount: '0.00', date: '2026-10-09' };

    expect(getDraftErrors({ ...legacy, description: 'Dinner' }, { baseline: legacy, today: TODAY })).toEqual({});
    expect(getDraftErrors({ ...legacy, amount: '0' }, { baseline: legacy, today: TODAY })).toEqual({});
  });

  it("keeps a former member's or a deleted account's assignment only while it is unchanged", () => {
    const deleted = { ...baseline, assignment: { kind: 'member', userId: null } } as const;

    expect(
      getDraftErrors({ ...baseline, amount: '70' }, { baseline, today: TODAY, available: { memberIds: [7] } }),
    ).toEqual({});
    expect(getDraftErrors({ ...deleted, amount: '70' }, { baseline: deleted, today: TODAY })).toEqual({});
    expect(
      getDraftErrors({ ...baseline, assignment: { kind: 'member', userId: null } }, { baseline, today: TODAY }),
    ).toEqual({ assignment: 'Choose who it’s assigned to' });
  });
});

describe('assignment defaults', () => {
  const personal = { spaceType: SpaceType.PERSONAL, userId: 7 };
  const group = { spaceType: SpaceType.GROUP, userId: 7 };

  it('assigns a new transaction to whoever records it, in a group space as in a personal one', () => {
    expect(defaultAssignment(group)).toEqual(you);
    expect(defaultAssignment(personal)).toEqual(you);
    expect(defaultAssignment({ spaceType: undefined, userId: 7 })).toEqual(you);
  });

  it('falls back to the whole space while the user is not known', () => {
    expect(defaultAssignment({ spaceType: SpaceType.PERSONAL, userId: undefined })).toEqual({ kind: 'space' });
    expect(defaultAssignment({ spaceType: SpaceType.GROUP, userId: undefined })).toEqual({ kind: 'space' });
  });

  it('repeats the last assignment for Add another while its member is known to be in the space', () => {
    expect(keptAssignment(lena, { ...group, memberIds: [7, 31] })).toEqual(lena);
    expect(keptAssignment(you, { ...personal, memberIds: [7] })).toEqual(you);
    expect(keptAssignment({ kind: 'unassigned' }, { ...personal, memberIds: [7] })).toEqual({ kind: 'unassigned' });
    expect(keptAssignment({ kind: 'space' }, personal)).toEqual({ kind: 'space' });
  });

  it('goes back to the author for Add another when the last member is gone or not known', () => {
    expect(keptAssignment(lena, group)).toEqual(you);
    expect(keptAssignment(lena, { ...group, memberIds: [7] })).toEqual(you);
    expect(keptAssignment(lena, { ...personal, memberIds: [7] })).toEqual(you);
    expect(keptAssignment({ kind: 'member', userId: null }, { ...personal, memberIds: [7] })).toEqual(you);
    expect(keptAssignment(null, group)).toEqual(you);
    expect(keptAssignment(null, personal)).toEqual(you);
  });
});

describe('requests', () => {
  it('sends the normalized values of a new transaction', () => {
    expect(toCreateRequest(edit({ amount: '12,5', description: '  ' }))).toEqual({
      assignment: { kind: 'member', user_id: 31 },
      category_id: 4,
      transaction_type: TransactionType.EXPENSE,
      amount: '12.50',
      date: '2026-10-05',
      time_zone: DEVICE_ZONE,
      description: null,
    });
  });

  it('sends the zone a stored request was made with, and the device’s otherwise', () => {
    expect(toCreateRequest(edit({ timeZone: 'America/Chicago' }))).toMatchObject({
      date: '2026-10-05',
      time_zone: 'America/Chicago',
    });
    expect(toUpdateRequest(edit({}))).toMatchObject({ date: '2026-10-05', time_zone: DEVICE_ZONE });
  });

  it('reads a stored create back as its draft, date and zone included', () => {
    const request = toCreateRequest(edit({ timeZone: 'America/Chicago' }));

    expect(draftFromCreateRequest(request)).toEqual({ ...edit({}), description: 'Lunch', timeZone: 'America/Chicago' });
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
