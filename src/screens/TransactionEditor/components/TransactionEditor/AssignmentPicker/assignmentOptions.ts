import type { SpaceMember } from '@api/dto';
import type { AssignmentModel } from '@api/models';
import type { AvatarSubject } from '@components/AssignmentAvatar/AssignmentAvatar';
import type { DraftAssignment } from '@redux/state/transactionFlow/draft';
import { isSameAssignment } from '@redux/state/transactionFlow/draft';
import { DELETED_MEMBER_LABEL, FORMER_MEMBER_LABEL, UNASSIGNED_LABEL, WHOLE_SPACE_LABEL } from '@shared/utils';

export interface AssignmentOption {
  key: string;
  value: DraftAssignment;
  subject: AvatarSubject;
  label: string;
  // Tells two people of one name apart, or says a saved person has left.
  detail?: string;
  // Where the label alone may not say who it is: a long name, a shared one, or someone who left.
  fullName: string;
  // The record's own person, no longer in the space: kept only while unchanged.
  isGone: boolean;
  isPerson: boolean;
}

interface Input {
  // Undefined until the members load, or when they failed to.
  members: SpaceMember[] | undefined;
  self: { id: number; name: string | null } | undefined;
  // What the record holds, in an edit.
  saved: AssignmentModel | null;
}

const person = (userId: number, name: string, isSelf: boolean): AssignmentOption => ({
  key: `member:${userId}`,
  value: { kind: 'member', userId },
  subject: { kind: 'member', userId, name, status: 'member' },
  label: isSelf ? 'You' : name,
  fullName: isSelf ? `You (${name})` : name,
  isGone: false,
  isPerson: true,
});

const WHOLE_SPACE: AssignmentOption = {
  key: 'space',
  value: { kind: 'space' },
  subject: { kind: 'space' },
  label: WHOLE_SPACE_LABEL,
  fullName: WHOLE_SPACE_LABEL,
  isGone: false,
  isPerson: false,
};

const UNASSIGNED: AssignmentOption = {
  key: 'unassigned',
  value: { kind: 'unassigned' },
  subject: { kind: 'unassigned' },
  label: UNASSIGNED_LABEL,
  fullName: UNASSIGNED_LABEL,
  isGone: false,
  isPerson: false,
};

// The record's person when the members known now do not include them: someone who left, a deleted account, or
// (while the members load) whoever it was saved with.
const savedPerson = (saved: AssignmentModel, activeIds: Set<number> | null): AssignmentOption | null => {
  if (saved.kind !== 'member') return null;

  const { userId, name, status } = saved.person;
  if (userId !== null && activeIds?.has(userId)) return null;
  if (status === 'deleted' || userId === null) {
    return {
      key: 'deleted',
      value: { kind: 'member', userId: null },
      subject: { kind: 'member', userId: null, name: null, status: 'deleted' },
      label: DELETED_MEMBER_LABEL,
      fullName: DELETED_MEMBER_LABEL,
      isGone: true,
      isPerson: true,
    };
  }

  const isGone = status === 'former_member' || activeIds !== null;
  const shown = name ?? 'Member';

  return {
    ...person(userId, shown, false),
    subject: { kind: 'member', userId, name, status: isGone ? 'former_member' : status },
    ...(isGone && { detail: FORMER_MEMBER_LABEL, fullName: `${shown} · ${FORMER_MEMBER_LABEL}` }),
    isGone,
  };
};

// Who a transaction can be assigned to: the whole space, the signed-in user, the other members (never a pending
// invitation), the record's own person who left, and nobody. Until the members load, the user alone among people.
export const buildAssignmentOptions = ({ members, self, saved }: Input): AssignmentOption[] => {
  const active = members?.flatMap((member) => (member.type === 'member' ? [member] : []));
  const activeIds = active ? new Set(active.map(({ user_id }) => user_id)) : null;
  const named = (active ?? []).map((member) => ({ ...member, shown: member.name?.trim() || member.email }));
  const counts = new Map<string, number>();
  named.forEach(({ shown }) => counts.set(shown.toLowerCase(), (counts.get(shown.toLowerCase()) ?? 0) + 1));

  const people = named
    .map(({ user_id, shown, email }) => {
      const option = person(user_id, shown, user_id === self?.id);
      const isShared = (counts.get(shown.toLowerCase()) ?? 0) > 1 && shown !== email;

      return isShared ? { ...option, detail: email, fullName: `${option.fullName} · ${email}` } : option;
    })
    .sort((a, b) => Number(b.label === 'You') - Number(a.label === 'You'));

  if (!active && self) people.push(person(self.id, self.name ?? 'You', true));

  const kept = saved && savedPerson(saved, activeIds);
  const extra = kept && !people.some(({ key }) => key === kept.key) ? kept : null;

  return [WHOLE_SPACE, ...people, ...(extra ? [extra] : []), UNASSIGNED];
};

export const PEOPLE_SHOWN = 5;

// A long list shows its first people and the picked one, in the list's order; the rest wait behind More, so the form
// never grows unbounded. `moreAt` is where More (or the loading people) goes: after the people, before nobody.
export const visibleOptions = (options: AssignmentOption[], selected: DraftAssignment | null, isExpanded: boolean) => {
  const people = options.filter(({ isPerson }) => isPerson);
  const beforeNobody = (shown: AssignmentOption[]) => {
    const index = shown.findIndex(({ key }) => key === UNASSIGNED.key);
    return index < 0 ? shown.length : index;
  };
  if (isExpanded || people.length <= PEOPLE_SHOWN + 1)
    return { shown: options, hidden: 0, moreAt: beforeNobody(options) };

  const first = people.slice(0, PEOPLE_SHOWN);
  const picked = people.find(({ value }) => isSameAssignment(value, selected));
  const shownPeople = new Set(picked ? [...first, picked] : first);
  const shown = options.filter((option) => !option.isPerson || shownPeople.has(option));

  return { shown, hidden: people.length - shownPeople.size, moreAt: beforeNobody(shown) };
};
