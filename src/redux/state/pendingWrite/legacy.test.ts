import { TransactionType } from '@shared/enums';
import { migrateLegacyWrites } from './legacy';

const body = {
  wallet_id: 3,
  category_id: 1,
  transaction_type: TransactionType.EXPENSE,
  amount: '12.00',
  timestamp: '2026-01-05T10:00:00.000Z',
  description: 'Lunch',
  client_operation_id: 'key-1',
};
const at = { spaceId: 4, firstSentAt: 1000 };

describe('migrateLegacyWrites', () => {
  it('keeps a create under its operation id, for the whole space and to be looked up first', () => {
    const { writes } = migrateLegacyWrites([
      { status: 'unknown', operation: { type: 'create', idempotencyKey: 'key-1', data: body, ...at } },
    ]);
    const { wallet_id: _walletId, timestamp: _timestamp, ...rest } = body;

    expect(writes).toEqual([
      {
        status: 'checking',
        operation: {
          type: 'create',
          idempotencyKey: 'key-1',
          ...at,
          data: {
            ...rest,
            date: '2026-01-05',
            time_zone: 'America/Chicago',
            assignment: { kind: 'space' },
            client_operation_id: 'key-1',
          },
          recovered: true,
        },
      },
    ]);
  });

  it('sends an edit again at its version with its own key, without the wallet', () => {
    const { writes, retiredEdits } = migrateLegacyWrites([
      {
        status: 'sending',
        operation: {
          type: 'update',
          idempotencyKey: 'key-2',
          transactionId: 'tx-1',
          version: 3,
          ...at,
          data: { wallet_id: 2, amount: '20.00' },
        },
      },
      {
        status: 'unknown',
        operation: { type: 'delete', idempotencyKey: 'key-3', transactionId: 'tx-2', version: 1, ...at },
      },
    ]);

    expect(retiredEdits).toEqual([]);
    expect(writes).toEqual([
      {
        status: 'unknown',
        operation: {
          type: 'update',
          idempotencyKey: 'key-2',
          transactionId: 'tx-1',
          version: 3,
          ...at,
          data: { amount: '20.00' },
        },
      },
      {
        status: 'unknown',
        operation: { type: 'delete', idempotencyKey: 'key-3', transactionId: 'tx-2', version: 1, ...at },
      },
    ]);
  });

  it('retires an edit that only moved the record to another wallet', () => {
    expect(
      migrateLegacyWrites([
        {
          status: 'unknown',
          operation: {
            type: 'update',
            idempotencyKey: 'key-2',
            transactionId: 'tx-1',
            version: 3,
            ...at,
            data: { wallet_id: 2 },
          },
        },
      ]),
    ).toEqual({ writes: [], retiredEdits: [{ spaceId: 4, transactionId: 'tx-1' }] });
  });

  it('drops whatever is not a write the old build could have stored', () => {
    expect(migrateLegacyWrites({ writes: [] })).toEqual({ writes: [], retiredEdits: [] });
    expect(migrateLegacyWrites([null, { operation: { type: 'move', spaceId: 1, idempotencyKey: 'k' } }])).toEqual({
      writes: [],
      retiredEdits: [],
    });
  });
});
