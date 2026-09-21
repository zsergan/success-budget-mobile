import type { LimitModel } from '@api/models';

export const getCommittedTotal = (categoryLimits: LimitModel[]): number =>
  categoryLimits.reduce((sum, limit) => sum + Number(limit.amount), 0);

export const isOverCommitted = (committedTotal: number, total?: LimitModel): boolean =>
  total ? committedTotal > Number(total.amount) : false;
