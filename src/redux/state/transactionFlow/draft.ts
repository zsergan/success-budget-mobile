import type { CreateTransactionRequest, TransactionAssignment, UpdateTransactionRequest } from '@api/dto';
import type { AssignmentModel, TransactionModel } from '@api/models';
import type { TransactionType } from '@shared/enums';

// Who the form assigns the amount to. A member's null id is the record's own deleted account, kept as it is.
export type DraftAssignment = { kind: 'member'; userId: number | null } | { kind: 'space' } | { kind: 'unassigned' };

export interface TransactionDraft {
  transactionType: TransactionType;
  // As typed, with either decimal separator.
  amount: string;
  categoryId: number | null;
  // Null only after the server refused a member who is no longer in the space: the user picks again.
  assignment: DraftAssignment | null;
  timestamp: string;
  description: string;
}

export interface DraftErrors {
  amount?: string;
  category?: string;
  assignment?: string;
  timestamp?: string;
  description?: string;
}

export const MAX_AMOUNT = '99999999.99';
export const DESCRIPTION_MAX_LENGTH = 140;
// The server refuses a timestamp more than a minute ahead of its clock.
const FUTURE_MARGIN_MS = 60_000;
// The first instant the server stores (MySQL TIMESTAMP).
export const MIN_TIMESTAMP = '1970-01-01T00:00:01.000Z';

export type AmountProblem = 'empty' | 'sign' | 'format' | 'scale' | 'zero' | 'range';

const AMOUNT_MESSAGES: Record<AmountProblem, string> = {
  empty: 'Enter an amount',
  sign: 'Enter the amount without a sign: the type sets it',
  format: 'Use digits and one decimal separator',
  scale: 'Use at most two decimal places',
  zero: 'Enter an amount greater than zero',
  range: 'The maximum amount is 99,999,999.99',
};

// Thousands groups of a pasted amount: "1 234,50", "1,234.50" or "1.234.567".
const GROUPED = /^\d{1,3}(?:([.,])\d{3})(?:\1\d{3})*$/;
const DIGITS = /^\d*$/;

const splitAmount = (text: string): { whole: string; fraction: string } | null => {
  const compact = text.replace(/(\d)[\s\u00A0\u202F']+(?=\d)/g, '$1');
  const lastSeparator = Math.max(compact.lastIndexOf('.'), compact.lastIndexOf(','));
  const separators = compact.match(/[.,]/g) ?? [];

  if (separators.length > 1) {
    const isGroupedWhole = separators.slice(0, -1).every((mark) => mark === separators[0]);
    const decimalMark = separators[separators.length - 1];

    if (decimalMark !== separators[0] && isGroupedWhole && GROUPED.test(compact.slice(0, lastSeparator))) {
      const fraction = compact.slice(lastSeparator + 1);

      return DIGITS.test(fraction) ? { whole: compact.slice(0, lastSeparator).replace(/[.,]/g, ''), fraction } : null;
    }

    return GROUPED.test(compact) ? { whole: compact.replace(/[.,]/g, ''), fraction: '' } : null;
  }

  const [whole, fraction = ''] = compact.split(/[.,]/);

  return DIGITS.test(whole) && DIGITS.test(fraction) && (whole + fraction).length > 0 ? { whole, fraction } : null;
};

// Reads an amount as typed or pasted, with either decimal separator; never cuts or rounds it.
const readAmount = (text: string): { amount: string } | { problem: AmountProblem } => {
  const trimmed = text.trim();

  if (trimmed === '') return { problem: 'empty' };
  if (/^[-+\u2212]/.test(trimmed)) return { problem: 'sign' };

  const parts = splitAmount(trimmed);

  if (!parts) return { problem: 'format' };
  if (parts.fraction.length > 2) return { problem: 'scale' };

  const whole = parts.whole.replace(/^0+(?=\d)/, '') || '0';

  return { amount: `${whole}.${parts.fraction.padEnd(2, '0')}` };
};

// "50", "50.0", "050,00" and "50." are the same amount: "50.00". Anything else is not an amount.
export const normalizeAmount = (value: string): string | null => {
  const read = readAmount(value);

  return 'amount' in read ? read.amount : null;
};

export const getAmountProblem = (value: string): AmountProblem | null => {
  const read = readAmount(value);

  if ('problem' in read) return read.problem;
  if (read.amount === '0.00') return 'zero';

  return read.amount.split('.')[0].length > MAX_AMOUNT.split('.')[0].length ? 'range' : null;
};

export const normalizeDescription = (value: string): string | null => value.trim() || null;

// Counted like the server: an emoji is one character.
export const descriptionLength = (value: string) => [...value.trim()].length;

export const createDraft = ({
  transactionType,
  assignment,
  timestamp,
}: Pick<TransactionDraft, 'transactionType' | 'assignment' | 'timestamp'>): TransactionDraft => ({
  transactionType,
  amount: '',
  categoryId: null,
  assignment,
  timestamp,
  description: '',
});

export const draftAssignmentOf = (assignment: AssignmentModel): DraftAssignment =>
  assignment.kind === 'member' ? { kind: 'member', userId: assignment.person.userId } : { kind: assignment.kind };

export const isSameAssignment = (a: DraftAssignment | null, b: DraftAssignment | null) =>
  a === b || (!!a && !!b && a.kind === b.kind && (a.kind !== 'member' || a.userId === (b as typeof a).userId));

export const draftFromTransaction = (transaction: TransactionModel): TransactionDraft => ({
  transactionType: transaction.transactionType,
  amount: transaction.amount,
  categoryId: transaction.category.id,
  assignment: draftAssignmentOf(transaction.assignment),
  timestamp: transaction.timestamp,
  description: transaction.description ?? '',
});

// The draft a create was sent from, as near as its body says: a member's id, or the whole space or nobody.
export const draftFromCreateRequest = (data: CreateTransactionRequest): TransactionDraft => ({
  transactionType: data.transaction_type,
  amount: data.amount,
  categoryId: data.category_id,
  assignment: data.assignment.kind === 'member' ? { kind: 'member', userId: data.assignment.user_id } : data.assignment,
  timestamp: data.timestamp,
  description: data.description ?? '',
});

const isSameAmount = (a: string, b: string) => (normalizeAmount(a) ?? a.trim()) === (normalizeAmount(b) ?? b.trim());

const isSameField: { [K in keyof TransactionDraft]: (a: TransactionDraft[K], b: TransactionDraft[K]) => boolean } = {
  transactionType: (a, b) => a === b,
  amount: isSameAmount,
  categoryId: (a, b) => a === b,
  assignment: isSameAssignment,
  timestamp: (a, b) => Date.parse(a) === Date.parse(b),
  description: (a, b) => normalizeDescription(a) === normalizeDescription(b),
};

export const changedFields = (draft: TransactionDraft, baseline: TransactionDraft) =>
  (Object.keys(isSameField) as (keyof TransactionDraft)[]).filter(
    (key) => !(isSameField[key] as (a: unknown, b: unknown) => boolean)(draft[key], baseline[key]),
  );

export const isDraftChanged = (draft: TransactionDraft, baseline: TransactionDraft) =>
  changedFields(draft, baseline).length > 0;

// An edit leaves values it does not change alone, as the server does: a legacy zero amount survives a new note, and a
// former member stays assigned. `available` holds what may be picked now, once loaded; an edit's own archived
// category counts while its type matches. The server still decides on a member who leaves while the save is sent.
export const getDraftErrors = (
  draft: TransactionDraft,
  {
    baseline,
    now,
    available,
  }: { baseline?: TransactionDraft; now: number; available?: { memberIds?: number[]; categoryIds?: number[] } },
): DraftErrors => {
  const changed = new Set(baseline ? changedFields(draft, baseline) : Object.keys(isSameField));
  const errors: DraftErrors = {};
  const amountProblem = getAmountProblem(draft.amount);

  if (changed.has('amount') && amountProblem) errors.amount = AMOUNT_MESSAGES[amountProblem];

  // A changed pick must still be on offer; an unchanged one is the record's own and stays.
  const isGone = (id: number | null, ids: number[] | undefined, isChanged: boolean) =>
    id !== null && !!ids && isChanged && !ids.includes(id);

  if (
    draft.categoryId === null ||
    isGone(draft.categoryId, available?.categoryIds, changed.has('categoryId') || changed.has('transactionType'))
  ) {
    errors.category = 'Choose a category';
  }

  const { assignment } = draft;
  const memberId = assignment?.kind === 'member' ? assignment.userId : null;

  if (
    !assignment ||
    (assignment.kind === 'member' && memberId === null && changed.has('assignment')) ||
    isGone(memberId, available?.memberIds, changed.has('assignment'))
  ) {
    errors.assignment = 'Choose who it’s assigned to';
  }

  if (changed.has('timestamp') && Date.parse(draft.timestamp) > now + FUTURE_MARGIN_MS) {
    errors.timestamp = 'A transaction cannot be in the future';
  } else if (changed.has('timestamp') && Date.parse(draft.timestamp) < Date.parse(MIN_TIMESTAMP)) {
    errors.timestamp = 'Pick a date after 1 January 1970';
  }

  if (descriptionLength(draft.description) > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Keep the note under ${DESCRIPTION_MAX_LENGTH} characters`;
  }

  return errors;
};

// A new transaction is the user's own unless they choose otherwise.
export const defaultAssignment = (userId: number | undefined): DraftAssignment =>
  userId === undefined ? { kind: 'space' } : { kind: 'member', userId };

// Add another repeats the last assignment while its member is still in the space; an unknown list keeps it, and the
// server decides.
export const keptAssignment = (
  last: DraftAssignment | null,
  { userId, memberIds }: { userId: number | undefined; memberIds?: number[] },
): DraftAssignment => {
  if (!last) return defaultAssignment(userId);
  if (last.kind !== 'member') return last;

  return last.userId !== null && (!memberIds || memberIds.includes(last.userId)) ? last : defaultAssignment(userId);
};

export const hasDraftErrors = (errors: DraftErrors) => Object.keys(errors).length > 0;

// A deleted account has no id to send; only leaving the assignment out keeps it.
const toAssignmentRequest = (assignment: DraftAssignment | null): TransactionAssignment | null => {
  if (!assignment) return null;
  if (assignment.kind !== 'member') return { kind: assignment.kind };

  return assignment.userId === null ? null : { kind: 'member', user_id: assignment.userId };
};

export const toCreateRequest = (draft: TransactionDraft): CreateTransactionRequest => ({
  assignment: toAssignmentRequest(draft.assignment)!,
  category_id: draft.categoryId!,
  transaction_type: draft.transactionType,
  amount: normalizeAmount(draft.amount) ?? draft.amount,
  timestamp: new Date(draft.timestamp).toISOString(),
  description: normalizeDescription(draft.description),
});

// The whole form, so a save that follows an unsettled one still ends in exactly this state; values equal to the
// stored ones are no change to the server, a former member's assignment included.
export const toUpdateRequest = (draft: TransactionDraft): UpdateTransactionRequest => {
  const { assignment: _assignment, ...request } = toCreateRequest(draft);
  const assignment = toAssignmentRequest(draft.assignment);

  return assignment ? { ...request, assignment } : request;
};
