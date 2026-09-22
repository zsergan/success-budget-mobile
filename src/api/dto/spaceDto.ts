import type { SpaceType } from '@shared/enums';
import type { Currency } from './currencyDto';

// The shape POST /spaces and POST /spaces/invites/accept actually return --
// the bare space entity, with no caller-specific `role`/`member_count`.
// Those two fields only come from GET /spaces (the list).
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
