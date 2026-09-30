import type { Money, StatisticsChange, StatisticsPeriod, StatisticsPreviousPeriod } from '@api/dto';

export type MoneySign = -1 | 0 | 1;

const MINUS = '−';
const MONEY_PATTERN = /^(-)?(\d+)(?:\.(\d+))?$/;

const parseMoney = (amount: Money) => {
  const match = MONEY_PATTERN.exec(amount.trim());
  if (!match) return null;

  const [, minus, whole, fraction = ''] = match;
  const isZero = /^0*$/.test(whole + fraction);

  return {
    sign: (isZero ? 0 : minus ? -1 : 1) as MoneySign,
    whole: whole.replace(/^0+(?=\d)/, ''),
    fraction: fraction.padEnd(2, '0'),
  };
};

// Read from the string itself: "0.00" is zero and "-0.00" is not negative.
export const getMoneySign = (amount: Money): MoneySign => parseMoney(amount)?.sign ?? 0;

const symbolCache = new Map<string, { prefix: string; suffix: string }>();

// The currency's own symbol and side, e.g. "$" before or " kr" after; the code if the device can't tell.
const getCurrencyAffixes = (currency: string) => {
  let affixes = symbolCache.get(currency);
  if (affixes) return affixes;

  try {
    const sample = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).format(0);
    const [prefix, suffix = ''] = sample.split(/0[.,]?0*/);
    affixes = { prefix, suffix };
  } catch {
    affixes = { prefix: `${currency} `, suffix: '' };
  }

  symbolCache.set(currency, affixes);
  return affixes;
};

// Groups the digits of a money string without going through Number, so no amount loses cents.
export const formatMoney = (amount: Money, currency: string, { signed = false } = {}) => {
  const parsed = parseMoney(amount);
  if (!parsed) return amount;

  const { prefix, suffix } = getCurrencyAffixes(currency);
  const grouped = parsed.whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = parsed.sign < 0 && signed ? MINUS : parsed.sign > 0 && signed ? '+' : '';

  return `${sign}${prefix}${grouped}.${parsed.fraction}${suffix}`;
};

// YYYY-MM-DD read as that calendar day on the device, not as UTC midnight.
export const parseDateKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);

  return new Date(year, month - 1, day);
};

const monthShort = (date: Date) => date.toLocaleString('en-US', { month: 'short' });
const monthLong = (date: Date) => date.toLocaleString('en-US', { month: 'long' });

const dayRange = (start: Date, end: Date, withYear: boolean) => {
  const year = withYear ? ` ${end.getFullYear()}` : '';

  if (start.getTime() === end.getTime()) return `${start.getDate()} ${monthShort(start)}${year}`;
  if (start.getFullYear() !== end.getFullYear()) {
    return `${start.getDate()} ${monthShort(start)} ${start.getFullYear()} – ${end.getDate()} ${monthShort(end)} ${end.getFullYear()}`;
  }
  if (start.getMonth() === end.getMonth()) return `${start.getDate()}–${end.getDate()} ${monthShort(end)}${year}`;

  return `${start.getDate()} ${monthShort(start)} – ${end.getDate()} ${monthShort(end)}${year}`;
};

// The period in words for "Net · …": a month by name, a year by number, anything else by its days.
export const formatPeriodWord = (
  period: Pick<StatisticsPeriod, 'type' | 'start_date' | 'end_date'>,
  now = new Date(),
) => {
  const start = parseDateKey(period.start_date);
  const end = parseDateKey(period.end_date);
  const isThisYear = start.getFullYear() === now.getFullYear() && end.getFullYear() === now.getFullYear();

  if (period.type === 'year') return `${start.getFullYear()}`;
  if (period.type === 'month') return isThisYear ? monthLong(start) : `${monthLong(start)} ${start.getFullYear()}`;

  return dayRange(start, end, !isThisYear);
};

// The local day an instant falls on in the period's zone.
const toZoneDate = (instant: string, timeZone: string) => {
  try {
    const key = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(instant));

    return parseDateKey(key);
  } catch {
    const date = new Date(instant);

    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
};

// "vs July" against a whole month, "vs 2025" against a whole year, otherwise the compared days.
export const formatComparisonLabel = (
  period: Pick<StatisticsPeriod, 'type' | 'start_date' | 'time_zone'>,
  previous: Pick<StatisticsPreviousPeriod, 'start_date' | 'end_date' | 'to' | 'actual_to'>,
) => {
  const start = parseDateKey(previous.start_date);
  const isWhole = previous.actual_to === previous.to;
  const end = isWhole ? parseDateKey(previous.end_date) : toZoneDate(previous.actual_to, period.time_zone);
  const periodYear = parseDateKey(period.start_date).getFullYear();
  const isOtherYear = start.getFullYear() !== periodYear || end.getFullYear() !== periodYear;

  if (isWhole && period.type === 'year') return `vs ${start.getFullYear()}`;
  if (isWhole && period.type === 'month') {
    return isOtherYear ? `vs ${monthLong(start)} ${start.getFullYear()}` : `vs ${monthLong(start)}`;
  }

  return `vs ${dayRange(start, end, isOtherYear)}`;
};

export type ChangeTone = 'good' | 'bad' | 'neutral';

// Income going up is good and expense going up is bad; a zero base has no percent at all.
export const formatChange = (
  change: StatisticsChange,
  direction: 'income' | 'expense',
): { text: string; tone: ChangeTone; hasPercent: boolean } => {
  if (change.percent === null) return { text: 'No comparison', tone: 'neutral', hasPercent: false };

  const rounded = Math.round(change.percent);
  if (rounded === 0) return { text: '0%', tone: 'neutral', hasPercent: true };

  const isUp = rounded > 0;
  const isGood = direction === 'income' ? isUp : !isUp;

  return { text: `${isUp ? '+' : MINUS}${Math.abs(rounded)}%`, tone: isGood ? 'good' : 'bad', hasPercent: true };
};

export const formatDayMonth = (key: string, now = new Date()) => {
  const date = parseDateKey(key);
  const year = date.getFullYear() === now.getFullYear() ? '' : ` ${date.getFullYear()}`;

  return `${date.getDate()} ${monthShort(date)}${year}`;
};

export const formatMonthYearShort = (key: string) => {
  const date = parseDateKey(key);

  return `${monthShort(date)} ${date.getFullYear()}`;
};
