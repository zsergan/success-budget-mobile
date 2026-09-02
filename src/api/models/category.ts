import type { TransactionType } from '@shared/enums';
import type { IconType } from '@shared/types';
import type { Category } from '@api/dto';

export interface CategoryModel {
  id: number;
  name: string;
  transactionType: TransactionType;
  icon: IconType;
  color: string;
  isActive: boolean;
}

export const mapCategory = (dto: Category): CategoryModel => ({
  id: dto.id,
  name: dto.name,
  transactionType: dto.transaction_type,
  icon: dto.icon,
  color: dto.color,
  isActive: dto.is_active === 1,
});
