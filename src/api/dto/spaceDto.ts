import type { SpaceType } from '@shared/enums';
import type { Currency } from './currencyDto';

export interface Space {
  id: number;
  name: string;
  type: SpaceType;
  currency: Currency;
  role: 'owner' | 'member';
  member_count: number;
  created_at: string;
}
