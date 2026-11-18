import type { AssignmentKey, TransactionAssigneesModel } from '@api/models';
import type { AvatarSubject } from '@components/AssignmentAvatar/AssignmentAvatar';
import { TransactionType } from '@shared/enums';
import { DELETED_MEMBER_LABEL, FORMER_MEMBER_LABEL, UNASSIGNED_LABEL, WHOLE_SPACE_LABEL } from '@shared/utils';

export interface FilterOption<Value> {
  key: string;
  value: Value | undefined;
  label: string;
  sub?: string;
  // The section a row opens, e.g. former members after everyone still in the space.
  section?: string;
  subject?: AvatarSubject;
}

export const TYPE_OPTIONS: FilterOption<TransactionType>[] = [
  { key: 'all', value: undefined, label: 'All types' },
  { key: TransactionType.EXPENSE, value: TransactionType.EXPENSE, label: 'Expenses' },
  { key: TransactionType.INCOME, value: TransactionType.INCOME, label: 'Income' },
];

// History's "Assigned to" choices: all, the user, the other members, the whole space and nobody (always valid), then
// people who have left with records here, and deleted accounts when any record is theirs.
export const assigneeOptions = (
  assignees: TransactionAssigneesModel | undefined,
  selfId: number | undefined,
): FilterOption<AssignmentKey>[] => {
  const members = [...(assignees?.members ?? [])].sort(
    (a, b) => Number(b.userId === selfId) - Number(a.userId === selfId),
  );

  return [
    { key: 'all', value: undefined, label: 'All transactions', sub: 'Everything in this period' },
    ...members.map(({ key, userId, name, status }) => ({
      key,
      value: key,
      label: userId === selfId ? 'You' : name,
      subject: { kind: 'member' as const, userId, name, status },
    })),
    {
      key: 'space',
      value: 'space',
      label: WHOLE_SPACE_LABEL,
      sub: 'Only shared operations',
      subject: { kind: 'space' },
    },
    {
      key: 'unassigned',
      value: 'unassigned',
      label: UNASSIGNED_LABEL,
      sub: 'Left unassigned on purpose',
      subject: { kind: 'unassigned' },
    },
    ...(assignees?.formerMembers ?? []).map(({ key, userId, name, status }, index) => ({
      key,
      value: key,
      label: `${name} · ${FORMER_MEMBER_LABEL}`,
      ...(index === 0 && { section: 'Former members' }),
      subject: { kind: 'member' as const, userId, name, status },
    })),
    ...(assignees?.hasDeletedMembers
      ? [
          {
            key: 'deleted_member',
            value: 'deleted_member' as const,
            label: DELETED_MEMBER_LABEL,
            sub: 'Accounts deleted since',
            subject: { kind: 'member' as const, userId: null, name: null, status: 'deleted' as const },
          },
        ]
      : []),
  ];
};
