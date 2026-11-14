import type { LimitModel, LimitsModel } from '@api/models';
import { AppColor, TransactionType } from '@shared/enums';
import type { LimitEntry } from './limitForecast';
import { forecastLimit } from './limitForecast';

const NOW = Date.parse('2026-10-06T12:00:00.000Z');
const THIS_MONTH = '2026-10-05T10:00:00.000Z';
const LAST_MONTH = '2026-09-28T10:00:00.000Z';

const limit = (id: number, amount: string, spent: number, categoryIds: number[], name: string | null = null) =>
  ({
    id,
    name,
    amount,
    spent,
    inPercent: 0,
    categories: categoryIds.map((categoryId) => ({
      id: categoryId,
      name: `Category ${categoryId}`,
      icon: 'grocery',
      color: AppColor.SLATE,
    })),
  }) as LimitModel;

// Grocery (1) alone at $150 of $200; Cafe (2) and Bar (3) share "Going out" at $90 of $100; Taxi (4) at $10 of $50.
const limits: LimitsModel = {
  period: {
    timeZone: 'Europe/Moscow',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    from: '2026-09-30T21:00:00.000Z',
    to: '2026-10-31T20:59:59.999Z',
  },
  total: limit(9, '1000.00', 700.1, []),
  categoryLimits: [
    limit(1, '200.00', 150, [1]),
    limit(2, '100.00', 90, [2, 3], 'Going out'),
    limit(3, '50.00', 10, [4]),
  ],
  overAllocation: null,
};

const expense = (categoryId: number, amount: string, timestamp = THIS_MONTH): LimitEntry => ({
  transactionType: TransactionType.EXPENSE,
  categoryId,
  amount,
  timestamp,
});

const forecast = (draft: LimitEntry, original: LimitEntry | null = null, from = limits) =>
  forecastLimit({ limits: from, original, draft, now: NOW });

describe('forecastLimit', () => {
  it('adds a new expense to the spent of its limit', () => {
    expect(forecast(expense(1, '20'))).toEqual({
      label: 'Category 1',
      level: 'near',
      capCents: 20000,
      spentCents: 15000,
      expectedCents: 17000,
      replacesOwn: false,
    });
    expect(forecast(expense(1, '70'))).toMatchObject({ level: 'over', expectedCents: 22000 });
    expect(forecast(expense(4, '5'))).toBeNull();
  });

  it('replaces the amount of an edit in the same category instead of adding it again', () => {
    expect(forecast(expense(1, '70'), expense(1, '50'))).toMatchObject({
      spentCents: 15000,
      expectedCents: 17000,
      replacesOwn: true,
    });
    expect(forecast(expense(1, '40'), expense(1, '50'))).toBeNull();
  });

  it('sees no change in a move between categories of one group limit', () => {
    expect(forecast(expense(3, '9'), expense(2, '9'))).toBeNull();
    expect(forecast(expense(3, '25'), expense(2, '9'))).toMatchObject({
      label: 'Going out',
      level: 'over',
      expectedCents: 10600,
      replacesOwn: true,
    });
  });

  it('counts a move between limits only in the one it goes to', () => {
    expect(forecast(expense(1, '45'), expense(4, '45'))).toMatchObject({
      label: 'Category 1',
      level: 'near',
      expectedCents: 19500,
      replacesOwn: false,
    });
    expect(forecast(expense(4, '45'), expense(1, '45'))).toMatchObject({
      label: 'Category 4',
      level: 'over',
      expectedCents: 5500,
      replacesOwn: false,
    });
    expect(forecast(expense(4, '20'), expense(1, '20'))).toBeNull();
  });

  it('warns about nothing when an expense becomes an income', () => {
    expect(forecast({ ...expense(1, '70'), transactionType: TransactionType.INCOME }, expense(1, '70'))).toBeNull();
  });

  it('counts only the share inside the limits month, in either direction', () => {
    expect(forecast(expense(1, '40'), expense(1, '40', LAST_MONTH))).toMatchObject({
      expectedCents: 19000,
      replacesOwn: false,
    });
    expect(forecast(expense(1, '40', LAST_MONTH), expense(1, '40'))).toBeNull();
    expect(forecast(expense(1, '90', LAST_MONTH))).toBeNull();
  });

  it('shows the monthly total by its name, after a category limit of the same level', () => {
    expect(forecast(expense(5, '100'))).toMatchObject({ label: 'Monthly total', level: 'near', expectedCents: 80010 });
    expect(forecast(expense(1, '20'))).toMatchObject({ label: 'Category 1' });
    expect(forecast(expense(4, '300'))).toMatchObject({ label: 'Category 4', level: 'over' });
    expect(forecast(expense(1, '35'))).toMatchObject({ label: 'Category 1', level: 'near' });
  });

  it('prefers an overrun to an approach', () => {
    expect(forecast(expense(4, '35'), null, { ...limits, total: limit(9, '1000.00', 990, []) })).toMatchObject({
      label: 'Monthly total',
      level: 'over',
    });
  });

  it('forecasts nothing without loaded limits, their month, or a valid amount', () => {
    expect(forecastLimit({ limits: undefined, original: null, draft: expense(1, '70'), now: NOW })).toBeNull();
    expect(forecast(expense(1, '70'), null, { ...limits, period: null })).toBeNull();
    expect(
      forecastLimit({ limits, original: null, draft: expense(1, '70'), now: Date.parse('2026-11-02') }),
    ).toBeNull();
    expect(forecast(expense(1, '12.345'))).toBeNull();
  });
});
