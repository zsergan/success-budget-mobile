import type { SpaceType } from '@shared/enums';
import type { Currency } from './currencyDto';

// What POST /spaces and invite accept return; `role`/`member_count` come only from GET /spaces.
export interface SpaceSummary {
  id: number;
  name: string;
  type: SpaceType;
  currency: Currency;
  created_at: string;
}

export interface Space extends SpaceSummary {
  role: 'owner' | 'member';
  member_count: number;
}

export interface CreateSpaceRequest {
  name: string;
  currency_id: number;
  type: SpaceType;
  invites?: string[];
}
