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
