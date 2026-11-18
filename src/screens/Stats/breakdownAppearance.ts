import type { AssignmentKey } from '@api/models';
import { toMobileIcon } from '@api/models';
import type { ColorTheme } from '@shared/theme';
import type { IconType } from '@shared/types';
import {
  assignmentKeyColor,
  assignmentKeyIcon,
  DELETED_MEMBER_LABEL,
  personLabel,
  UNASSIGNED_LABEL,
  WHOLE_SPACE_LABEL,
} from '@shared/utils';

import type { BreakdownGroup } from './statsItems';

export interface BreakdownAppearance {
  name: string;
  icon: IconType;
  color: string;
  iconColor: string;
  iconBackground: string;
  // A group that is not a person: the whole space, nobody, or accounts that no longer exist.
  isMuted: boolean;
}

export const assignmentGroupName = (
  group: Extract<BreakdownGroup, { kind: 'member' | 'space' | 'unassigned' | 'deleted_member' }>,
  selfId: number | undefined,
) => {
  switch (group.kind) {
    case 'space':
      return WHOLE_SPACE_LABEL;
    case 'unassigned':
      return UNASSIGNED_LABEL;
    case 'deleted_member':
      return DELETED_MEMBER_LABEL;
    case 'member':
      return personLabel({ userId: group.user_id, name: group.name, status: group.status ?? 'member' }, selfId);
  }
};

// One look per group for its row and its segment: a category's own colour, a person's colour, and neutral tones for
// the whole space, nobody, deleted accounts and Other.
export const getBreakdownAppearance = (
  group: BreakdownGroup,
  colorTheme: ColorTheme,
  selfId: number | undefined,
): BreakdownAppearance => {
  const { colors, categories } = colorTheme;

  switch (group.kind) {
    case 'other':
      return {
        name: 'Other',
        icon: 'more',
        color: colors.chartOther,
        iconColor: colors.chartOther,
        iconBackground: colors.track,
        isMuted: false,
      };
    case 'category': {
      const { stroke, tint } = categories[group.color];

      return {
        name: group.name,
        icon: toMobileIcon(group.icon),
        color: stroke,
        iconColor: stroke,
        iconBackground: tint,
        isMuted: false,
      };
    }
    default: {
      const key = group.key as AssignmentKey;
      const color = assignmentKeyColor(key, selfId, colorTheme);
      const isPerson = group.kind === 'member';

      return {
        name: assignmentGroupName(group, selfId),
        icon: assignmentKeyIcon(key),
        color,
        iconColor: isPerson ? color : colors.muted,
        iconBackground: colors.track,
        isMuted: group.kind === 'deleted_member' || group.status === 'former_member',
      };
    }
  }
};
