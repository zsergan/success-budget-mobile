import type { LimitModel } from '@api/models';
import type { RootState } from '@redux/Store';

export const selectLimit = (state: RootState) => state.limit;

export const findLimitForCategory = (categoryLimits: LimitModel[], categoryId: number): LimitModel | undefined =>
  categoryLimits.find((limit) => limit.categories.some((category) => category.id === categoryId));
