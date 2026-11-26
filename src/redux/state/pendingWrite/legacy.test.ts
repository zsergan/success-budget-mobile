import { TransactionType } from '@shared/enums';
import { migrateLegacyWrites, migrateTimestampWrites } from './legacy';

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

describe('migrateTimestampWrites', () => {
  const timestampBody = {
    category_id: 1,
    transaction_type: TransactionType.EXPENSE,
    amount: '12.00',
    timestamp: '2026-10-08T21:30:00+03:00',
    description: 'Lunch',
    assignment: { kind: 'space' },
    client_operation_id: 'key-1',
  };
  const create = (status: string, timestamp = timestampBody.timestamp) => ({
    status,
    operation: { type: 'create', idempotencyKey: 'key-1', data: { ...timestampBody, timestamp }, ...at },
  });

  it.each([
    // 18:30 UTC: 13:30 in Chicago, whatever the offset the instant was written with.
    ['2026-10-08T21:30:00+03:00', '2026-10-08'],
    // Late evening in Chicago is the next day in UTC.
    ['2026-01-15T05:59:59.999Z', '2026-01-14'],
    ['2026-01-15T06:00:00.000Z', '2026-01-15'],
    ['2026-07-15T04:59:59.999Z', '2026-07-14'],
    ['2026-11-01T06:30:00.000Z', '2026-11-01'],
    ['2027-01-01T05:59:59.999Z', '2026-12-31'],
  ])('dates %s by its Chicago day, sent with that zone', (timestamp, date) => {
    const { writes } = migrateTimestampWrites({ version: 2, writes: [create('unknown', timestamp)] });
    const { timestamp: _timestamp, ...rest } = timestampBody;

    expect(writes).toEqual([
      {
        status: 'checking',
        operation: {
          type: 'create',
          idempotencyKey: 'key-1',
          ...at,
          data: { ...rest, date, time_zone: 'America/Chicago' },
          recovered: true,
        },
      },
    ]);
  });

  it('gives the same body every time it is converted', () => {
    const stored = { version: 2, writes: [create('sending')] };

    expect(migrateTimestampWrites(stored)).toEqual(migrateTimestampWrites(JSON.parse(JSON.stringify(stored))));
  });

  it('keeps what the user decides on, and looks a found record up again when it cannot be read', () => {
    const found = { id: 'tx-1', timestamp: 'yesterday', category: { color: 'clay' } };
    const { writes } = migrateTimestampWrites({
      version: 2,
      writes: [create('expired'), create('retry'), create('accessLost'), { ...create('found'), found }],
    });

    expect(writes.map(({ status, found: record }) => [status, record])).toEqual([
      ['expired', undefined],
      ['retry', undefined],
      ['accessLost', undefined],
      ['checking', undefined],
    ]);
  });

  it('drops a write it cannot convert, and reads nothing from what is not its envelope', () => {
    expect(
      migrateTimestampWrites({ version: 2, writes: [create('unknown', 'not a date'), null, { status: 'x' }] }),
    ).toEqual({
      writes: [],
      isReadable: true,
    });
    expect(migrateTimestampWrites([create('unknown')])).toEqual({ writes: [], isReadable: false });
    expect(migrateTimestampWrites({ version: 3, writes: [] })).toEqual({ writes: [], isReadable: false });
    expect(migrateTimestampWrites(undefined)).toEqual({ writes: [], isReadable: false });
  });
});
