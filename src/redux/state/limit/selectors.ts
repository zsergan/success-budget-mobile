import type { LimitModel, LimitsModel } from '@api/models';

export const EMPTY_LIMITS: LimitsModel = { period: null, total: null, categoryLimits: [], overAllocation: null };

export const findLimitForCategory = (categoryLimits: LimitModel[], categoryId: number): LimitModel | undefined =>
  categoryLimits.find((limit) => limit.categories.some((category) => category.id === categoryId));
