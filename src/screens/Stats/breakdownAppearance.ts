import { toMobileIcon } from '@api/models';
import type { ColorTheme } from '@shared/theme';
import type { IconType } from '@shared/types';

import type { BreakdownGroup } from './statsItems';

export interface BreakdownAppearance {
  name: string;
  icon: IconType;
  color: string;
  iconColor: string;
  iconBackground: string;
}

// One look per group for its row and its segment: a category's or wallet's own color, neutral grays for the service groups.
export const getBreakdownAppearance = (
  group: BreakdownGroup,
  { colors, categories }: ColorTheme,
): BreakdownAppearance => {
  switch (group.kind) {
    case 'other':
      return {
        name: 'Other',
        icon: 'more',
        color: colors.chartOther,
        iconColor: colors.chartOther,
        iconBackground: colors.track,
      };
    case 'deleted_wallets':
      return {
        name: 'Deleted wallets',
        icon: 'wallet',
        color: colors.chartDeleted,
        iconColor: colors.muted,
        iconBackground: colors.track,
      };
    default: {
      const { stroke, tint } = categories[group.color];

      return {
        name: group.name,
        icon: group.kind === 'wallet' ? 'wallet' : toMobileIcon(group.icon),
        color: stroke,
        iconColor: stroke,
        iconBackground: tint,
      };
    }
  }
};
