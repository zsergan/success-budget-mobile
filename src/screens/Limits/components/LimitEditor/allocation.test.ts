import type { LimitModel } from '@api/models';
import { getCommittedTotal, isOverCommitted } from './allocation';

const makeLimit = (amount: string): LimitModel => ({
  id: 1,
  name: null,
  amount,
  spent: 0,
  inPercent: 0,
  categories: [],
});

describe('getCommittedTotal', () => {
  it('sums the amount across all category limits', () => {
    expect(getCommittedTotal([makeLimit('100'), makeLimit('50.5')])).toBe(150.5);
  });

  it('returns 0 for an empty list', () => {
    expect(getCommittedTotal([])).toBe(0);
  });
});

describe('isOverCommitted', () => {
  it('is false when there is no monthly total to compare against', () => {
    expect(isOverCommitted(150, undefined)).toBe(false);
  });

  it('is true when committed spending exceeds the total', () => {
    expect(isOverCommitted(150, makeLimit('100'))).toBe(true);
  });

  it('is false when committed spending is within the total', () => {
    expect(isOverCommitted(80, makeLimit('100'))).toBe(false);
  });
});
