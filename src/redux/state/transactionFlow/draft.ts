import type { CreateTransactionRequest, UpdateTransactionRequest } from '@api/dto';
import type { TransactionModel } from '@api/models';
import type { TransactionType } from '@shared/enums';

export interface TransactionDraft {
  transactionType: TransactionType;
  // As typed, with either decimal separator.
  amount: string;
  categoryId: number | null;
  // In an edit, null keeps the deleted wallet the record still points at.
  walletId: number | null;
  timestamp: string;
  description: string;
}

export interface DraftErrors {
  amount?: string;
  category?: string;
  wallet?: string;
  timestamp?: string;
  description?: string;
}

export const MAX_AMOUNT = '99999999.99';
export const DESCRIPTION_MAX_LENGTH = 140;
// The server refuses a timestamp more than a minute ahead of its clock.
const FUTURE_MARGIN_MS = 60_000;

// "50", "50.0" and "050,00" are the same amount: "50.00". Anything else is not an amount.
export const normalizeAmount = (value: string): string | null => {
  const match = value
    .trim()
    .replace(',', '.')
    .match(/^(\d+)(?:\.(\d{0,2}))?$/);

  if (!match) return null;

  const whole = match[1].replace(/^0+(?=\d)/, '');

  return `${whole}.${(match[2] ?? '').padEnd(2, '0')}`;
};

const isWithinRange = (amount: string) => {
  const [whole] = amount.split('.');
  const [maxWhole] = MAX_AMOUNT.split('.');

  return amount !== '0.00' && whole.length <= maxWhole.length;
};

export const normalizeDescription = (value: string): string | null => value.trim() || null;

// Counted like the server: an emoji is one character.
export const descriptionLength = (value: string) => [...value.trim()].length;

export const createDraft = ({
  transactionType,
  walletId,
  timestamp,
}: Pick<TransactionDraft, 'transactionType' | 'walletId' | 'timestamp'>): TransactionDraft => ({
  transactionType,
  amount: '',
  categoryId: null,
  walletId,
  timestamp,
  description: '',
});

export const draftFromTransaction = (transaction: TransactionModel): TransactionDraft => ({
  transactionType: transaction.transactionType,
  amount: transaction.amount,
  categoryId: transaction.category.id,
  walletId: transaction.wallet?.id ?? null,
  timestamp: transaction.timestamp,
  description: transaction.description ?? '',
});

const isSameAmount = (a: string, b: string) => (normalizeAmount(a) ?? a.trim()) === (normalizeAmount(b) ?? b.trim());

const isSameField: { [K in keyof TransactionDraft]: (a: TransactionDraft[K], b: TransactionDraft[K]) => boolean } = {
  transactionType: (a, b) => a === b,
  amount: isSameAmount,
  categoryId: (a, b) => a === b,
  walletId: (a, b) => a === b,
  timestamp: (a, b) => Date.parse(a) === Date.parse(b),
  description: (a, b) => normalizeDescription(a) === normalizeDescription(b),
};

export const changedFields = (draft: TransactionDraft, baseline: TransactionDraft) =>
  (Object.keys(isSameField) as (keyof TransactionDraft)[]).filter(
    (key) => !(isSameField[key] as (a: unknown, b: unknown) => boolean)(draft[key], baseline[key]),
  );

export const isDraftChanged = (draft: TransactionDraft, baseline: TransactionDraft) =>
  changedFields(draft, baseline).length > 0;

// An edit leaves values it does not change alone, as the server does: a legacy zero amount survives a new note.
export const getDraftErrors = (
  draft: TransactionDraft,
  { baseline, now }: { baseline?: TransactionDraft; now: number },
): DraftErrors => {
  const changed = new Set(baseline ? changedFields(draft, baseline) : Object.keys(isSameField));
  const errors: DraftErrors = {};
  const amount = normalizeAmount(draft.amount);

  if (changed.has('amount') && (amount === null || !isWithinRange(amount))) {
    errors.amount = draft.amount.trim() === '' ? 'Enter an amount' : 'Enter an amount from 0.01 to 99,999,999.99';
  }

  if (draft.categoryId === null) errors.category = 'Choose a category';
  if (!baseline && draft.walletId === null) errors.wallet = 'Choose a wallet';

  if (changed.has('timestamp') && Date.parse(draft.timestamp) > now + FUTURE_MARGIN_MS) {
    errors.timestamp = 'A transaction cannot be in the future';
  }

  if (descriptionLength(draft.description) > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Keep the note under ${DESCRIPTION_MAX_LENGTH} characters`;
  }

  return errors;
};

export const hasDraftErrors = (errors: DraftErrors) => Object.keys(errors).length > 0;

export const toCreateRequest = (draft: TransactionDraft): CreateTransactionRequest => ({
  wallet_id: draft.walletId!,
  category_id: draft.categoryId!,
  transaction_type: draft.transactionType,
  amount: normalizeAmount(draft.amount) ?? draft.amount,
  timestamp: new Date(draft.timestamp).toISOString(),
  description: normalizeDescription(draft.description),
});

// The whole form, so a save that follows an unsettled one still ends in exactly this state; values equal to the
// stored ones are no change to the server. A null wallet is left out, which keeps the deleted one.
export const toUpdateRequest = (draft: TransactionDraft): UpdateTransactionRequest => {
  const { wallet_id, ...request } = toCreateRequest(draft);

  return draft.walletId === null ? request : { ...request, wallet_id };
};
