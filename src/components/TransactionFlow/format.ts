import type { CalendarDate } from '@shared/utils';
import { formatRelativeDate } from '@shared/utils';

// A record's date as the user picked it: "Today", "Yesterday", "Aug 29", and the year only when it is not this one.
export const formatTransactionDate = (date: CalendarDate, today?: CalendarDate) =>
  formatRelativeDate(date, { now: today });
