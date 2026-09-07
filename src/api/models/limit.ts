import type { GetLimitsResponse, LimitCategory, LimitView, OverAllocation } from '@api/dto';

export interface LimitModel {
  id: number;
  name: string | null;
  amount: string;
  spent: number;
  inPercent: number;
  categories: LimitCategory[];
}

export interface OverAllocationModel {
  categoryTotal: number;
  difference: number;
}

export interface LimitsModel {
  total: LimitModel | null;
  categoryLimits: LimitModel[];
  overAllocation: OverAllocationModel | null;
}

export const mapLimitView = (dto: LimitView): LimitModel => ({
  id: dto.id,
  name: dto.name,
  amount: dto.amount,
  spent: dto.spent,
  inPercent: dto.in_percent,
  categories: dto.categories,
});

const mapOverAllocation = (dto: OverAllocation): OverAllocationModel => ({
  categoryTotal: dto.category_total,
  difference: dto.difference,
});

export const mapLimitsResponse = (dto: GetLimitsResponse): LimitsModel => ({
  total: dto.total ? mapLimitView(dto.total) : null,
  categoryLimits: dto.categories.map(mapLimitView),
  overAllocation: dto.over_allocation ? mapOverAllocation(dto.over_allocation) : null,
});
