import { mapTransaction } from '@api/models';
import { transactionDto } from '@redux/state/transaction/fixtures';
import { whereSaved } from './selection';

const january = { from: '2026-01-01T00:00:00.000Z', to: '2026-01-31T23:59:59.999Z' };
const lunch = mapTransaction(transactionDto({ timestamp: '2026-01-05T10:00:00.000Z' }));

describe('whereSaved', () => {
  it('claims nothing without a selection', () => {
    expect(whereSaved(lunch, null)).toBe('shown');
  });

  it('tells a record outside the period, bounds included, from one inside it', () => {
    expect(whereSaved(lunch, january)).toBe('shown');
    expect(whereSaved({ ...lunch, timestamp: january.to }, january)).toBe('shown');
    expect(whereSaved({ ...lunch, timestamp: '2026-02-01T00:00:00.000Z' }, january)).toBe('otherPeriod');
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
    expect(whereSaved({ ...lunch, timestamp: '2026-02-01T00:00:00.000Z' }, lena)).toBe('otherPeriod');
  });
});
