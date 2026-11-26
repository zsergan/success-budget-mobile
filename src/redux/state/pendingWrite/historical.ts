import type { TransactionKind, TransactionType } from '@shared/enums';

// Pending writes as earlier builds stored them, spelled out on their own: they record what was sent then, so they
// never follow the request types of the current API. Only the migration of stored writes reads them.

type HistoricalType = TransactionType;

type HistoricalAssignment = { kind: 'member'; user_id: number } | { kind: 'space' } | { kind: 'unassigned' };

// Builds before v2 (`pendingTransactionWrites.v1.<userId>`): v1 bodies, a create's naming its wallet, as a bare array.
export interface WalletEraBody {
  category_id: number;
  transaction_type: HistoricalType;
  amount: string;
  // An instant with `Z` or an offset.
  timestamp: string;
  description?: string | null;
  wallet_id?: number;
  client_operation_id?: string;
}

export type WalletEraOperation = { idempotencyKey: string; firstSentAt: number; spaceId: number } & (
  | { type: 'create'; data: WalletEraBody }
  | { type: 'update'; transactionId: string; version: number; data: Partial<WalletEraBody> }
  | { type: 'delete'; transactionId: string; version: number }
);

export interface WalletEraWrite {
  operation: WalletEraOperation;
  status: string;
}

// Builds from v2 until calendar dates (`pendingTransactionWrites.v2.<userId>`, `{ version: 2, writes }`): v2 bodies
// with a `timestamp` instant.
export interface TimestampCreateBody {
  category_id: number;
  transaction_type: HistoricalType;
  amount: string;
  timestamp: string;
  description?: string | null;
  assignment: HistoricalAssignment;
  client_operation_id?: string;
}

export type TimestampUpdateBody = Partial<Omit<TimestampCreateBody, 'client_operation_id'>>;

export type TimestampOperation = { idempotencyKey: string; firstSentAt: number; spaceId: number } & (
  | { type: 'create'; data: TimestampCreateBody; recovered?: true }
  | { type: 'update'; transactionId: string; version: number; data: TimestampUpdateBody }
  | { type: 'delete'; transactionId: string; version: number }
);

type HistoricalPersonStatus = 'member' | 'former_member' | 'deleted';

interface HistoricalPerson {
  userId: number | null;
  name: string | null;
  status: HistoricalPersonStatus;
}

// The record a create was found to have made, kept with the write: the app's transaction model of those builds.
export interface TimestampTransactionSnapshot {
  id: string;
  kind: TransactionKind;
  transactionType: HistoricalType;
  amount: string;
  timestamp: string;
  description: string | null;
  version: number;
  category: {
    id: number;
    name: string;
    transactionType: HistoricalType;
    icon: string;
    color: string;
    isArchived: boolean;
  };
  author: HistoricalPerson & { source: 'recorded' | 'imported' };
  assignment: { kind: 'member'; person: HistoricalPerson } | { kind: 'space' } | { kind: 'unassigned' };
}

export interface TimestampWrite {
  operation: TimestampOperation;
  status: string;
  found?: TimestampTransactionSnapshot;
}

export interface TimestampEnvelope {
  version: 2;
  writes: TimestampWrite[];
}
