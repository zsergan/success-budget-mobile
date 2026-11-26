import type { AppColor, TransactionType } from '@shared/enums';
import { TransactionKind } from '@shared/enums';
import type { IconType } from '@shared/types';
import type { CalendarDate } from '@shared/utils/calendarDate';
import type {
  AssigneeOption,
  AuthorSource,
  Money,
  PersonStatus,
  Transaction,
  TransactionAssigneesResponse,
  TransactionAssignmentView,
  TransactionCategory,
  TransactionFeedResponse,
  TransactionPerson,
} from '@api/dto';

import { toMobileIcon } from './category';

export interface TransactionCategoryModel {
  id: number;
  name: string;
  transactionType: TransactionType;
  icon: IconType;
  color: AppColor;
  isArchived: boolean;
}

// A user a record refers to, as the space knows them now; a deleted account has neither id nor name.
export interface PersonModel {
  userId: number | null;
  name: string | null;
  status: PersonStatus;
}

export interface AuthorModel extends PersonModel {
  source: AuthorSource;
}

// Who the amount is for: one person (a member, a former member or a deleted account), the whole space, or nobody.
export type AssignmentModel = { kind: 'member'; person: PersonModel } | { kind: 'space' } | { kind: 'unassigned' };

export interface TransactionModel {
  id: string;
  kind: TransactionKind;
  transactionType: TransactionType;
  amount: string;
  date: CalendarDate;
  description: string | null;
  version: number;
  category: TransactionCategoryModel;
  // Set by the server on create; no edit changes it.
  author: AuthorModel;
  assignment: AssignmentModel;
}

export interface TransactionWriteResult {
  transaction: TransactionModel;
}

export interface TransactionFeedSummary {
  count: number;
  income: Money;
  expense: Money;
}

export interface TransactionFeedPageModel {
  items: TransactionModel[];
  nextCursor: string | null;
  previousCursor: string | null;
  summary: TransactionFeedSummary;
  dayTotals: { date: CalendarDate; net: Money }[];
}

// The feed's and the breakdown's `assignment` value; the server's keys are passed through unchanged.
export type AssignmentKey = 'space' | 'unassigned' | 'deleted_member' | `member:${number}`;

export const memberKey = (userId: number): AssignmentKey => `member:${userId}`;

export interface AssigneeOptionModel {
  key: AssignmentKey;
  userId: number;
  name: string;
  status: Exclude<PersonStatus, 'deleted'>;
}

export interface TransactionAssigneesModel {
  members: AssigneeOptionModel[];
  formerMembers: AssigneeOptionModel[];
  hasDeletedMembers: boolean;
}

export const mapTransactionCategory = (dto: TransactionCategory): TransactionCategoryModel => ({
  id: dto.id,
  name: dto.name,
  transactionType: dto.transaction_type,
  icon: toMobileIcon(dto.icon),
  color: dto.color,
  isArchived: dto.is_archived,
});

const mapPerson = ({ user_id, name, status }: TransactionPerson): PersonModel => ({ userId: user_id, name, status });

export const mapAssignment = (dto: TransactionAssignmentView): AssignmentModel =>
  dto.kind === 'member'
    ? { kind: 'member', person: mapPerson({ user_id: dto.user_id, name: dto.name, status: dto.status ?? 'member' }) }
    : { kind: dto.kind };

export const mapTransaction = (dto: Transaction): TransactionModel => ({
  id: dto.id,
  kind: dto.kind,
  transactionType: dto.transaction_type,
  amount: dto.amount,
  date: dto.date,
  description: dto.description,
  version: dto.version,
  category: mapTransactionCategory(dto.category),
  author: { ...mapPerson(dto.author), source: dto.author.source },
  assignment: mapAssignment(dto.assignment),
});

export const mapTransactionFeed = (dto: TransactionFeedResponse): TransactionFeedPageModel => ({
  items: dto.items.map(mapTransaction),
  nextCursor: dto.page_info.next_cursor,
  previousCursor: dto.page_info.previous_cursor,
  summary: dto.summary,
  dayTotals: dto.day_totals,
});

const mapAssigneeOption = ({ key, user_id, name, status }: AssigneeOption): AssigneeOptionModel => ({
  key: key as AssignmentKey,
  userId: user_id,
  name,
  status,
});

export const mapTransactionAssignees = (dto: TransactionAssigneesResponse): TransactionAssigneesModel => ({
  members: dto.members.map(mapAssigneeOption),
  formerMembers: dto.former_members.map(mapAssigneeOption),
  hasDeletedMembers: dto.has_deleted_members,
});

// The filter that lists a record's group: a deleted account's records are one group, whoever they were.
export const assignmentKeyOf = (assignment: AssignmentModel): AssignmentKey => {
  if (assignment.kind !== 'member') return assignment.kind;

  return assignment.person.userId === null ? 'deleted_member' : memberKey(assignment.person.userId);
};

// The starting balance is read-only: no edit, no delete, and it is not income.
export const isInitialBalance = (transaction: Pick<TransactionModel, 'kind'>) =>
  transaction.kind === TransactionKind.INITIAL_BALANCE;
