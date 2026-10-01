import { toMobileIcon } from '@api/models';
import { getCategoryStroke, getCategoryTint } from '@shared/categoryColors';
import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';

import type { BreakdownGroup } from './statsItems';

export const OTHER_COLOR = '#8B95A3';
export const DELETED_WALLETS_COLOR = '#C3C9D2';

export interface BreakdownAppearance {
  name: string;
  icon: IconType;
  color: string;
  iconColor: string;
  iconBackground: string;
}

// One look per group for its row and its segment: a category's or wallet's own color, neutral grays for the service groups.
export const getBreakdownAppearance = (group: BreakdownGroup): BreakdownAppearance => {
  switch (group.kind) {
    case 'other':
      return { name: 'Other', icon: 'more', color: OTHER_COLOR, iconColor: OTHER_COLOR, iconBackground: colors.track };
    case 'deleted_wallets':
      return {
        name: 'Deleted wallets',
        icon: 'wallet',
        color: DELETED_WALLETS_COLOR,
        iconColor: colors.muted,
        iconBackground: colors.track,
      };
    default: {
      const color = getCategoryStroke(group.color);

      return {
        name: group.name,
        icon: group.kind === 'wallet' ? 'wallet' : toMobileIcon(group.icon),
        color,
        iconColor: color,
        iconBackground: getCategoryTint(group.color),
      };
    }
  }
};
