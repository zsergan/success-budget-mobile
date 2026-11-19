import type { AssignmentBreakdownItem, StatisticsBreakdown } from '@api/dto';
import { formatMoneyAmount, formatSignedAmount } from '@shared/utils';

export const HOME_ASSIGNMENT_ROWS = 5;
export const HOME_TOP_CATEGORIES = 3;

const HIDDEN = '••••';

// Hidden amounts keep their currency and, for a net, its sign: the bars and labels around them stay.
export const homeMoney = (amount: string, currencyCode: string | undefined, isHidden: boolean) =>
  isHidden ? `${HIDDEN}${currencyCode ? ` ${currencyCode}` : ''}` : formatMoneyAmount(amount, currencyCode);

export const homeNet = (amount: string, currencyCode: string | undefined, isHidden: boolean) => {
  if (!isHidden) return formatSignedAmount(amount, currencyCode);

  const sign = Number(amount) > 0 ? '+' : Number(amount) < 0 ? '-' : '';
  return `${sign}${homeMoney(amount, currencyCode, true)}`;
};

const byAmount = (a: { amount: string }, b: { amount: string }) => Number(b.amount) - Number(a.amount);

// Home shows a few groups: the whole space and nobody always, as their own rows however small, then the largest
// people; the rest are a tap away in Stats. Other is unfolded, since its people are rows like any other here.
export const homeAssignmentRows = (
  { primary_items, other }: StatisticsBreakdown['by_assignment'],
  limit = HOME_ASSIGNMENT_ROWS,
) => {
  const all = [...primary_items, ...(other?.children ?? [])].sort(byAmount);
  const special = all.filter(({ kind }) => kind === 'space' || kind === 'unassigned');
  const people = all.filter((item) => !special.includes(item));
  const rows: AssignmentBreakdownItem[] = [...special, ...people.slice(0, Math.max(0, limit - special.length))].sort(
    byAmount,
  );

  return { rows, total: all.length, hidden: all.length - rows.length };
};
