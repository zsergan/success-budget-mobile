import type { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import type { CategoryIconApi } from './categoryDto';
import type { Money } from './statisticsDto';

// Resolved on every read from the space's members now; a deleted account keeps neither id nor name.
export type PersonStatus = 'member' | 'former_member' | 'deleted';

export interface TransactionPerson {
  user_id: number | null;
  name: string | null;
  status: PersonStatus;
}

// `imported`: filled in when wallets were retired, so it does not prove who entered the record.
export type AuthorSource = 'recorded' | 'imported';

export interface TransactionAuthor extends TransactionPerson {
  source: AuthorSource;
}

export type AssignmentKind = 'member' | 'space' | 'unassigned';

// A write's assignment: one member of the space now, the whole space, or explicitly nobody.
export type TransactionAssignment = { kind: 'member'; user_id: number } | { kind: 'space' } | { kind: 'unassigned' };

// What reads return: `user_id`, `name` and `status` are set only for a member, `user_id` null once deleted.
export interface TransactionAssignmentView {
  kind: AssignmentKind;
  user_id: number | null;
  name: string | null;
  status: PersonStatus | null;
}

// Not the Categories API item: transaction_count, limit and sort are absent.
export interface TransactionCategory {
  id: number;
  name: string;
  transaction_type: TransactionType;
  icon: CategoryIconApi | string;
  color: AppColor;
  is_active: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// One v2 shape for the feed, latest, details and every write result; the author never changes after the create.
export interface Transaction {
  id: string;
  kind: TransactionKind;
  transaction_type: TransactionType;
  amount: string;
  timestamp: string;
  description: string | null;
  version: number;
  category: TransactionCategory;
  author: TransactionAuthor;
  assignment: TransactionAssignmentView;
}

// The feed's `summary.count` for the same period, query and filters, initial balances included.
export interface TransactionsCountResponse {
  count: number;
}

// One page of `/transactions/feed`; `summary` covers the whole selection, `day_totals` each whole day on the page.
export interface TransactionFeedResponse {
  items: Transaction[];
  page_info: {
    // Opaque; `next_cursor` leads to older records, `previous_cursor` to newer ones.
    next_cursor: string | null;
    previous_cursor: string | null;
  };
  summary: { count: number; income: Money; expense: Money };
  day_totals: { date: string; net: Money }[];
}

export interface CreateTransactionRequest {
  category_id: number;
  transaction_type: TransactionType;
  amount: string;
  timestamp: string;
  description?: string | null;
  assignment: TransactionAssignment;
  // The create's Idempotency-Key; the server never applies two creates with one id in a space, whatever version.
  client_operation_id?: string;
}

// Every v2 write answers with the record as a read of it after the commit.
export interface TransactionWriteResponse {
  transaction: Transaction;
}

// An absent field, or one equal to the stored value, keeps it; `null` only clears the description. An assignment
// equal to the stored one is no change, even to someone who has left since.
export type UpdateTransactionRequest = Partial<Omit<CreateTransactionRequest, 'client_operation_id'>>;

// What a create with this operation id did: `deleted` means it applied and the record was deleted since.
export interface TransactionOperationResponse {
  operation_id: string;
  status: 'applied' | 'deleted';
  transaction_id: string;
  created_at: string;
  deleted_at: string | null;
  transaction: Transaction | null;
}

// History's "Assigned to" filter: `key` is the feed's `assignment` value. `space` and `unassigned` are always valid
// and not listed.
export interface AssigneeOption {
  key: string;
  user_id: number;
  name: string;
  status: Exclude<PersonStatus, 'deleted'>;
}

export interface TransactionAssigneesResponse {
  // Current members in joining order.
  members: AssigneeOption[];
  // No longer members, with records assigned to them; by name, then user id.
  former_members: AssigneeOption[];
  has_deleted_members: boolean;
}
