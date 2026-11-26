import { mapTransaction } from '@api/models';
import { transactionDto } from '@redux/state/transaction/fixtures';
import { rangeSelection, whereSaved } from './selection';

const january = { fromDate: '2026-01-01', toDate: '2026-01-31' };
const lunch = mapTransaction(transactionDto({ date: '2026-01-05' }));

describe('whereSaved', () => {
  it('claims nothing without a selection', () => {
    expect(whereSaved(lunch, null)).toBe('shown');
  });

  it('tells a record outside the period, bounds included, from one inside it', () => {
    expect(whereSaved(lunch, january)).toBe('shown');
    expect(whereSaved({ ...lunch, date: january.fromDate }, january)).toBe('shown');
    expect(whereSaved({ ...lunch, date: january.toDate }, january)).toBe('shown');
    expect(whereSaved({ ...lunch, date: '2026-02-01' }, january)).toBe('otherPeriod');
    expect(whereSaved({ ...lunch, date: '2025-12-31' }, january)).toBe('otherPeriod');
  });

  it('takes a picked period as the days it shows', () => {
    const range = { from: new Date(2026, 0, 1), to: new Date(2026, 0, 31, 23, 59, 59, 999) };

    expect(rangeSelection(range)).toEqual(january);
  });
});

describe('whereSaved with filters', () => {
  it('tells a record that left the assignment, type or category the list is narrowed to', () => {
    const lena = { ...january, assignment: 'member:31' as const };

    expect(whereSaved(lunch, { ...january, assignment: 'member:7' })).toBe('shown');
    expect(whereSaved(lunch, lena)).toBe('otherFilter');
    expect(whereSaved({ ...lunch, assignment: { kind: 'space' } }, { ...january, assignment: 'space' })).toBe('shown');
    expect(whereSaved(lunch, { ...january, transactionType: lunch.transactionType, categoryId: 2 })).toBe(
      'otherFilter',
    );
    expect(whereSaved({ ...lunch, date: '2026-02-01' }, lena)).toBe('otherPeriod');
  });
});
