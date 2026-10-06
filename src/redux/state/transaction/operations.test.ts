import type { CreateTransactionRequest } from '@api/dto';
import { createAppStore } from '@redux/Store';
import { logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import { TransactionType } from '@shared/enums';
import { createTransactionResponseDto, transactionDto } from './fixtures';
import type { OperationMemory, TransactionRequest } from './operations';
import { classifyTransactionError, submitTransactionRequest } from './operations';

const mockedRequest = jest.fn();
let mockKeys = 0;

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

jest.mock('expo-crypto', () => ({ randomUUID: () => `key-${++mockKeys}` }));

// RTK Query batches store notifications on an animation frame, which would otherwise fire after teardown.
jest.useFakeTimers();

interface SentRequest {
  method: string;
  url: string;
  data?: unknown;
  headers: Record<string, string>;
}

const noAnswer = () => Promise.reject(new Error('Network Error'));
const fails = (statusCode: number, code: string) => () =>
  Promise.reject({ response: { data: { statusCode, code, message: code } } });
const answers = (data: unknown) => () => Promise.resolve({ data });

const sent = () =>
  mockedRequest.mock.calls.map(([{ method, url, data, headers }]: [SentRequest]) => ({ method, url, data, headers }));

const lunch: CreateTransactionRequest = {
  wallet_id: 1,
  category_id: 1,
  transaction_type: TransactionType.EXPENSE,
  amount: '10',
  timestamp: '2026-01-05T10:00:00.000Z',
  description: 'Lunch',
};

const create = (data = lunch): TransactionRequest & { type: 'create' } => ({ type: 'create', spaceId: 1, data });

const setUp = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(1));

  let memory: OperationMemory | null = null;

  const submit = async (request: TransactionRequest) => {
    const submission = await store.dispatch(submitTransactionRequest(request, memory));

    memory = submission.memory;

    return submission.outcome;
  };

  return { store, submit };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockKeys = 0;
});

describe('classifyTransactionError', () => {
  it.each([
    [{ statusCode: 0, message: 'Could not reach the server.' }, 'uncertain'],
    [{ statusCode: 500, code: 'INTERNAL_SERVER_ERROR' }, 'uncertain'],
    [{ statusCode: 400, code: 'VALIDATION_FAILED' }, 'validation'],
    [{ statusCode: 400, code: 'WALLET_DELETED' }, 'validation'],
    [{ statusCode: 403, code: 'FORBIDDEN_CATEGORY' }, 'validation'],
    [{ statusCode: 409, code: 'TRANSACTION_VERSION_CONFLICT' }, 'conflict'],
    [{ statusCode: 404, code: 'TRANSACTION_NOT_FOUND' }, 'notFound'],
    [{ statusCode: 403, code: 'FORBIDDEN_SPACE' }, 'accessLost'],
    [{ statusCode: 429, code: 'TOO_MANY_REQUESTS' }, 'rejected'],
    [undefined, 'uncertain'],
  ])('reads %j as %s', (error, kind) => {
    expect(classifyTransactionError(error)).toBe(kind);
  });
});

describe('submitTransactionRequest', () => {
  it('retries an unanswered create with the same key and body', async () => {
    const { submit } = setUp();

    mockedRequest.mockImplementationOnce(noAnswer).mockImplementationOnce(answers(createTransactionResponseDto()));

    expect(await submit(create())).toMatchObject({ status: 'failed', failure: { kind: 'uncertain' } });
    expect(await submit(create())).toMatchObject({ status: 'succeeded', result: { transaction: { id: 'tx-1' } } });

    const [first, retry] = sent();

    expect(retry).toEqual(first);
    expect(first.headers).toEqual({ 'Idempotency-Key': 'key-1' });
  });

  it('settles an unanswered create before saving a changed draft as an edit of what it made', async () => {
    const { submit } = setUp();
    const dinner = { ...lunch, amount: '25', description: undefined };

    mockedRequest
      .mockImplementationOnce(noAnswer)
      .mockImplementationOnce(answers(createTransactionResponseDto()))
      .mockImplementationOnce(
        answers({
          transaction: transactionDto({ amount: '25.00', version: 2 }),
          wallets: [{ id: 1, balance: 75, is_deleted: false }],
        }),
      );

    await submit(create());
    const outcome = await submit(create(dinner));

    expect(sent()).toEqual([
      { method: 'POST', url: '/spaces/1/transactions', data: lunch, headers: { 'Idempotency-Key': 'key-1' } },
      { method: 'POST', url: '/spaces/1/transactions', data: lunch, headers: { 'Idempotency-Key': 'key-1' } },
      {
        method: 'PATCH',
        url: '/spaces/1/transactions/tx-1',
        data: { ...dinner, description: null },
        headers: { 'Idempotency-Key': 'key-2', 'If-Match': '"1"' },
      },
    ]);
    expect(outcome).toEqual({
      status: 'succeeded',
      result: expect.objectContaining({ wallet: expect.objectContaining({ balance: 75 }), previousBalance: 100 }),
    });
  });

  it('sends a changed draft as a new create once the earlier one was refused', async () => {
    const { submit } = setUp();

    mockedRequest
      .mockImplementationOnce(fails(400, 'VALIDATION_FAILED'))
      .mockImplementationOnce(answers(createTransactionResponseDto()));

    await submit(create({ ...lunch, amount: '0' }));
    await submit(create());

    expect(sent().map(({ method, headers }) => [method, headers['Idempotency-Key']])).toEqual([
      ['POST', 'key-1'],
      ['POST', 'key-2'],
    ]);
  });

  it('stops at what settling the earlier attempt finds, without sending the change', async () => {
    const { submit } = setUp();
    const edit = (amount: string): TransactionRequest => ({
      type: 'update',
      spaceId: 1,
      transactionId: 'tx-1',
      version: 1,
      data: { amount },
    });

    mockedRequest.mockImplementationOnce(noAnswer).mockImplementationOnce(fails(409, 'TRANSACTION_VERSION_CONFLICT'));

    await submit(edit('20'));
    const outcome = await submit(edit('30'));

    expect(outcome).toMatchObject({
      status: 'failed',
      failure: { kind: 'conflict' },
      operation: { data: { amount: '20' } },
    });
    expect(sent()).toHaveLength(2);
  });

  it('edits at the version an unanswered edit turned out to make', async () => {
    const { submit } = setUp();
    const edit = (amount: string): TransactionRequest => ({
      type: 'update',
      spaceId: 1,
      transactionId: 'tx-1',
      version: 1,
      data: { amount },
    });
    const edited = (version: number) =>
      answers({ transaction: transactionDto({ version }), wallets: [{ id: 1, balance: 80, is_deleted: false }] });

    mockedRequest.mockImplementationOnce(noAnswer).mockImplementationOnce(edited(2)).mockImplementationOnce(edited(3));

    await submit(edit('20'));
    expect(await submit(edit('30'))).toMatchObject({ status: 'succeeded', result: { transaction: { version: 3 } } });

    expect(sent().map(({ headers }) => headers)).toEqual([
      { 'Idempotency-Key': 'key-1', 'If-Match': '"1"' },
      { 'Idempotency-Key': 'key-1', 'If-Match': '"1"' },
      { 'Idempotency-Key': 'key-2', 'If-Match': '"2"' },
    ]);
  });

  it('counts a delete of a record that is already gone as done', async () => {
    const { submit } = setUp();

    mockedRequest.mockImplementationOnce(fails(404, 'TRANSACTION_NOT_FOUND'));

    expect(await submit({ type: 'delete', spaceId: 1, transactionId: 'tx-1', version: 1 })).toEqual({
      status: 'succeeded',
      result: null,
    });
  });

  it('keeps a result that arrives in another space or session from surfacing', async () => {
    const { store, submit } = setUp();
    let finish: (value: unknown) => void = () => {};

    mockedRequest.mockImplementation(() => new Promise((resolve) => (finish = resolve)));

    const inOtherSpace = submit(create());

    store.dispatch(activateSpace(2));
    finish({ data: createTransactionResponseDto() });
    expect(await inOtherSpace).toEqual({ status: 'stale' });

    store.dispatch(activateSpace(1));
    const afterLogout = submit(create());

    await store.dispatch(logoutMe());
    finish({ data: createTransactionResponseDto() });
    expect(await afterLogout).toEqual({ status: 'stale' });
  });

  it('sends nothing for a draft of a space that is no longer active', async () => {
    const { store, submit } = setUp();

    store.dispatch(activateSpace(2));

    expect(await submit(create())).toEqual({ status: 'stale' });
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});
