export type LimitStatusLevel = 'ok' | 'near' | 'over';

export interface LimitStatus {
  level: LimitStatusLevel;
  pctActual: number;
  pctClamped: number;
}

export const getLimitStatus = (spent: number, amount: number): LimitStatus => {
  const pctActual = amount > 0 ? Math.floor((spent / amount) * 100) : 0;
  const level: LimitStatusLevel = pctActual > 100 ? 'over' : pctActual >= 80 ? 'near' : 'ok';

  return { level, pctActual, pctClamped: Math.min(100, pctActual) };
};

// Calendar month, resets on the 1st, no rollover — inclusive of today.
export const getDaysLeftInMonth = (reference: Date = new Date()): number => {
  const daysInMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();

  return daysInMonth - reference.getDate() + 1;
};

// Can go negative once the limit is already over — callers decide how to display that.
export const getDailyPace = (spent: number, amount: number, daysLeft: number): number =>
  daysLeft > 0 ? (amount - spent) / daysLeft : amount - spent;
