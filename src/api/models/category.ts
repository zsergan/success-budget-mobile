import type { AppColor, TransactionType } from '@shared/enums';
import type { IconType } from '@shared/types';
import { ICON_PATHS } from '@shared/icons';
import type { Category, CategoryIconApi, GetCategoriesResponse } from '@api/dto';

export interface CategoryLimitRefModel {
  id: number;
  name: string | null;
}

export interface CategoryModel {
  id: number;
  name: string;
  transactionType: TransactionType;
  icon: IconType;
  color: AppColor;
  isActive: boolean;
  transactionCount: number;
  limit: CategoryLimitRefModel | null;
  archivedAt: string | null;
}

export interface CategoriesModel {
  incomes: CategoryModel[];
  expenses: CategoryModel[];
  archived: CategoryModel[];
}

// Backend enum values are the mobile icon key with the first letter capitalized and '-' replaced by a space
// (e.g. `grocery`→`Grocery`, `home-goods`→`Home goods`). Old rows may still carry a pre-redesign legacy name
// that doesn't fit this rule at all — fall back to the raw value so `LEGACY_ICON_ALIASES` keeps resolving it.
export const toMobileIcon = (backendIcon: string): IconType => {
  const candidate = backendIcon.charAt(0).toLowerCase() + backendIcon.slice(1).replace(/ /g, '-');

  return (candidate in ICON_PATHS ? candidate : backendIcon) as IconType;
};

export const toBackendIcon = (icon: IconType): CategoryIconApi =>
  (icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-/g, ' ')) as CategoryIconApi;

export const mapCategory = (dto: Category): CategoryModel => ({
  id: dto.id,
  name: dto.name,
  transactionType: dto.transaction_type,
  icon: toMobileIcon(dto.icon),
  color: dto.color,
  isActive: dto.is_active === 1,
  transactionCount: dto.transaction_count,
  limit: dto.limit,
  archivedAt: dto.archived_at,
});

export const mapCategoriesResponse = (dto: GetCategoriesResponse): CategoriesModel => ({
  incomes: dto.incomes.map(mapCategory),
  expenses: dto.expenses.map(mapCategory),
  archived: dto.archived.map(mapCategory),
});
