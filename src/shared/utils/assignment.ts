import type { AssignmentKey, AssignmentModel, AuthorModel, PersonModel } from '@api/models';
import { AppColor } from '@shared/enums';
import type { ColorTheme } from '@shared/theme';
import type { IconType } from '@shared/types';

export const WHOLE_SPACE_LABEL = 'Whole space';
export const UNASSIGNED_LABEL = 'No member assigned';
export const DELETED_MEMBER_LABEL = 'Deleted member';
export const FORMER_MEMBER_LABEL = 'Former member';
export const IMPORTED_AUTHOR_LABEL = 'Imported from wallet history';

// A person as the space knows them now: "You", their name, "Lena · Former member", or "Deleted member".
export const personLabel = ({ userId, name, status }: PersonModel, selfId: number | undefined) => {
  if (status === 'deleted') return DELETED_MEMBER_LABEL;

  const shown = userId !== null && userId === selfId ? 'You' : (name ?? 'Member');

  return status === 'former_member' ? `${shown} · ${FORMER_MEMBER_LABEL}` : shown;
};

// A deleted account's assignment stays a person's: never "No member assigned".
export const assignmentLabel = (assignment: AssignmentModel, selfId: number | undefined) => {
  switch (assignment.kind) {
    case 'space':
      return WHOLE_SPACE_LABEL;
    case 'unassigned':
      return UNASSIGNED_LABEL;
    case 'member':
      return personLabel(assignment.person, selfId);
  }
};

// An imported author was filled in when wallets were retired and proves nothing about who entered the record.
export const authorLabel = (author: AuthorModel, selfId: number | undefined) =>
  author.source === 'imported' ? IMPORTED_AUTHOR_LABEL : personLabel(author, selfId);

// The ordinary case a personal space's lists leave unsaid; Whole space and No member assigned are always said.
export const isOwnAssignment = (assignment: AssignmentModel, selfId: number | undefined) =>
  assignment.kind === 'member' && assignment.person.status === 'member' && assignment.person.userId === selfId;

const MEMBER_COLORS = [AppColor.INDIGO, AppColor.EVERGREEN, AppColor.PLUM, AppColor.CLAY, AppColor.SLATE];

// A person keeps one colour wherever they are drawn; the signed-in user is always amber.
export const memberAppColor = (userId: number, selfId: number | undefined) =>
  userId === selfId ? AppColor.AMBER : MEMBER_COLORS[userId % MEMBER_COLORS.length];

export const assignmentKeyIcon = (key: AssignmentKey): IconType => {
  if (key === 'space') return 'users';
  if (key === 'unassigned') return 'minus';
  if (key === 'deleted_member') return 'user-x';

  return 'user';
};

// The whole space is drawn in the text colour, nobody in a faint one, so neither reads as a person.
export const assignmentKeyColor = (
  key: AssignmentKey,
  selfId: number | undefined,
  { colors, categories }: ColorTheme,
) => {
  if (key === 'space') return colors.text;
  if (key === 'unassigned') return colors.faint;
  if (key === 'deleted_member') return colors.chartDeleted;

  return categories[memberAppColor(Number(key.slice('member:'.length)), selfId)].stroke;
};
