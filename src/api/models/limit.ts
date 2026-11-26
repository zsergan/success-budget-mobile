import type { CategoryColor } from '@shared/categoryColors';
import { readCategoryColor } from '@shared/categoryColors';
import type { IconType } from '@shared/types';
import type { GetLimitsResponse, LimitsPeriod, LimitView, OverAllocation } from '@api/dto';
import type { CalendarDate } from '@shared/utils/calendarDate';
import { toMobileIcon } from './category';

export interface LimitCategoryModel {
  id: number;
  name: string;
  icon: IconType;
  color: CategoryColor;
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

export interface LimitsPeriodModel {
  timeZone: string;
  startDate: CalendarDate;
  endDate: CalendarDate;
}

export interface LimitsModel {
  period: LimitsPeriodModel | null;
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
    color: readCategoryColor(category.color),
  })),
});

const mapOverAllocation = (dto: OverAllocation): OverAllocationModel => ({
  categoryTotal: dto.category_total,
  difference: dto.difference,
});

const mapPeriod = (dto: LimitsPeriod): LimitsPeriodModel => ({
  timeZone: dto.time_zone,
  startDate: dto.start_date,
  endDate: dto.end_date,
});

export const mapLimitsResponse = (dto: GetLimitsResponse): LimitsModel => ({
  period: dto.period ? mapPeriod(dto.period) : null,
  total: dto.total ? mapLimitView(dto.total) : null,
  categoryLimits: dto.categories.map(mapLimitView),
  overAllocation: dto.over_allocation ? mapOverAllocation(dto.over_allocation) : null,
});
