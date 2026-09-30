import type { Period } from '@shared/utils';
import { customPeriod } from '@shared/utils';

export type RangeField = 'from' | 'to';

// Any picked day turns the draft into Custom; From then moves on to To, and a pick
// on the wrong side of the other end moves that end instead of inverting the range.
export const pickDay = (
  current: { from: Date; to: Date },
  field: RangeField,
  date: Date,
): { period: Period; nextField: RangeField } => {
  if (field === 'from') {
    const to = date.getTime() > current.to.getTime() ? date : current.to;

    return { period: customPeriod(date, to), nextField: 'to' };
  }

  if (date.getTime() < current.from.getTime()) {
    return { period: customPeriod(date, current.from), nextField: 'from' };
  }

  return { period: customPeriod(current.from, date), nextField: 'from' };
};
