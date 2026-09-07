import type { AppColor } from '@shared/enums';
import type { IconType } from '@shared/types';
import type { GetLimitsResponse, LimitView, OverAllocation } from '@api/dto';
import { toMobileIcon } from './category';

export interface LimitCategoryModel {
  id: number;
  name: string;
  icon: IconType;
  color: AppColor;
}

export interface LimitModel {
  id: number;
  name: string | null;
  amount: string;
  spent: number;
  inPercent: number;
  categories: LimitCategoryModel[];
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
  categories: dto.categories.map((category) => ({
    id: category.id,
    name: category.name,
    icon: toMobileIcon(category.icon),
    color: category.color,
  })),
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
