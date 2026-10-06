import type { LimitModel, LimitsModel } from '@api/models';
import { normalizeAmount } from '@redux/state/transactionFlow/draft';
import { TransactionType } from '@shared/enums';
import { toCents } from '@shared/utils';

// What a record adds to limits: an expense, in a category, at an instant.
export interface LimitEntry {
  transactionType: TransactionType;
  categoryId: number | null;
  amount: string;
  timestamp: string;
}

export type ForecastLevel = 'near' | 'over';

export interface LimitForecast {
  label: string;
  level: ForecastLevel;
  capCents: number;
  spentCents: number;
  expectedCents: number;
  // The record already counts in this limit, so the change replaces its share instead of adding to it.
  replacesOwn: boolean;
}

const NEAR_PERCENT = 80;
const TOTAL_LABEL = 'Monthly total';

const limitLabel = ({ name, categories }: LimitModel) =>
  categories.length > 1
    ? (name ?? categories.map((category) => category.name).join(' + '))
    : (categories[0]?.name ?? name ?? 'Limit');

// Only an expense of the limit's month adds to it: the monthly total takes every one, a category limit its own.
const shareOf = (
  entry: LimitEntry | null,
  cents: number,
  limit: LimitModel,
  isTotal: boolean,
  month: [number, number],
) => {
  if (!entry || entry.transactionType !== TransactionType.EXPENSE) return 0;

  const at = Date.parse(entry.timestamp);
  if (at < month[0] || at > month[1]) return 0;

  return isTotal || limit.categories.some(({ id }) => id === entry.categoryId) ? cents : 0;
};

const levelOf = (expected: number, cap: number): ForecastLevel | null =>
  expected > cap ? 'over' : expected * 100 >= cap * NEAR_PERCENT ? 'near' : null;

// Expected spending of every limit the change raises: spent − the record's share as saved + the draft's share. The
// most serious one wins, a category limit over the monthly total on a tie. Without loaded limits or their month
// nothing is forecast, rather than a guess from zero.
export const forecastLimit = ({
  limits,
  original,
  draft,
  now,
}: {
  limits: LimitsModel | undefined;
  original: LimitEntry | null;
  draft: LimitEntry;
  now: number;
}): LimitForecast | null => {
  const period = limits?.period;
  if (!limits || !period) return null;

  const month: [number, number] = [Date.parse(period.from), Date.parse(period.to)];
  if (now < month[0] || now > month[1]) return null;

  const draftAmount = normalizeAmount(draft.amount);
  if (draftAmount === null) return null;

  const draftCents = toCents(draftAmount);
  const originalCents = original ? toCents(normalizeAmount(original.amount) ?? 'NaN') : 0;
  const candidates = [
    ...limits.categoryLimits.map((limit) => ({ limit, isTotal: false })),
    ...(limits.total ? [{ limit: limits.total, isTotal: true }] : []),
  ];

  const forecasts = candidates.flatMap(({ limit, isTotal }): LimitForecast[] => {
    const own = shareOf(original, originalCents, limit, isTotal, month);
    const next = shareOf(draft, draftCents, limit, isTotal, month);
    const capCents = toCents(limit.amount);
    const spentCents = toCents(limit.spent);
    const expectedCents = spentCents - own + next;
    const level = levelOf(expectedCents, capCents);

    if (Number.isNaN(expectedCents + capCents) || next <= own || !level) return [];

    return [
      {
        label: isTotal ? TOTAL_LABEL : limitLabel(limit),
        level,
        capCents,
        spentCents,
        expectedCents,
        replacesOwn: own > 0,
      },
    ];
  });

  return forecasts.find(({ level }) => level === 'over') ?? forecasts[0] ?? null;
};
