import { TRANSACTION_WRITE_TAGS, transactionApi } from '@redux/state/transaction/api';
import { spaceTags } from '@redux/api/baseApi';
import type { AppThunk } from '@redux/Store';
import { selectProfileId } from '../profile/selectors';
import { loseSpaceAccess } from '../space/thunks';
import type { StoredOperation, TransactionOperation, WriteResult } from '../transaction/operations';
import {
  classifyTransactionError,
  holdWriteLock,
  lookUpCreate,
  settleWrite,
  writeLockKey,
} from '../transaction/operations';
import type { RetiredEdit } from './legacy';
import { selectPendingWrite } from './selectors';
import type { PendingWrite } from './slice';
import { WAITING_FOR_USER, writeSettled, writesRestored } from './slice';
import { carryOver, persistPendingWrites, readPendingWrites } from './storage';

export const inSession = (operation: StoredOperation, sessionKey: number): TransactionOperation =>
  Object.freeze({ ...operation, sessionKey });

// Writes left unsettled by a closed form, a lost connection or a restart; the user's own, never another's. Those of an
// earlier format are stored in the current one at once, and their old keys go once that save succeeds. Edits an older
// build left that only changed a wallet come back so the user can be told they were not kept.
export const restorePendingWrites =
  (userId: number): AppThunk<Promise<RetiredEdit[]>> =>
  (dispatch, getState, { restoringWrites }) => {
    const run = (async () => {
      const { writes, retiredEdits, sources } = await readPendingWrites(userId);
      if (selectProfileId(getState()) !== userId) return [];

      dispatch(writesRestored({ userId, writes }));
      if (sources.length > 0) {
        carryOver(userId, sources);
        await dispatch(persistPendingWrites());
      }
      retiredEdits.forEach(({ spaceId }) =>
        dispatch(transactionApi.util.invalidateTags(spaceTags(spaceId, ...TRANSACTION_WRITE_TAGS))),
      );

      return retiredEdits;
    })();

    restoringWrites.set(userId, run);

    return run.finally(() => {
      if (restoringWrites.get(userId) === run) restoringWrites.delete(userId);
    });
  };

export interface ResumedWrite {
  operation: StoredOperation;
  result: WriteResult;
  // An older build's create, only looked up: what it found is offered in place rather than reported.
  wasLookedUp: boolean;
}

const applyCheck =
  (write: PendingWrite, operation: TransactionOperation, userId: number): AppThunk<Promise<WriteResult>> =>
  async (dispatch, getState) => {
    const result = await dispatch(lookUpCreate(operation, { kind: 'expired' }));

    if (result.kind === 'stale' || getState().pendingWrite.userId !== userId) return result;

    const key = operation.idempotencyKey;
    // Only the attempt this check was made for takes its answer: a write discarded, or sent again, since is left alone.
    const current = selectPendingWrite(getState(), key);
    if (current?.status !== 'checking' || current.operation !== write.operation) return result;

    if (result.kind === 'applied') dispatch(writeSettled({ key, status: 'found', found: result.transaction }));
    else if (result.kind === 'deleted') dispatch(writeSettled({ key, status: null }));
    else if (result.kind === 'expired') dispatch(writeSettled({ key, status: 'retry' }));
    else if (result.kind === 'refused' && classifyTransactionError(result.error) === 'accessLost') {
      dispatch(writeSettled({ key, status: 'accessLost' }));
    }
    await dispatch(persistPendingWrites());
    if (result.kind === 'refused' && classifyTransactionError(result.error) === 'accessLost') {
      dispatch(loseSpaceAccess(operation.spaceId));
    }

    return result;
  };

// An older build's create, asked about by its operation id in the space it was made in, before anything is sent: it
// had applied, it applied and was deleted since, nothing applied, or there is no answer yet. It holds the write's lock,
// so a send asked for meanwhile waits for its answer, and a check asked for during a send joins that send.
const checkLegacyCreate =
  (write: PendingWrite, sessionKey: number): AppThunk<Promise<WriteResult>> =>
  (dispatch, getState, { runningWrites }) => {
    const operation = inSession(write.operation, sessionKey);
    const userId = getState().pendingWrite.userId;
    if (userId === null) return Promise.resolve({ kind: 'stale' });

    const lock = writeLockKey(userId, operation);
    const running = runningWrites.get(lock);
    if (running) return running.promise as Promise<WriteResult>;

    return holdWriteLock(runningWrites, lock, 'check', () => dispatch(applyCheck(write, operation, userId)));
  };

// Sends every unsettled write again with its own key, looks up a create whose key ran out, and asks about an older
// build's creates. Writes that wait for the user are left alone.
export const resumePendingWrites = (): AppThunk<Promise<ResumedWrite[]>> => (dispatch, getState) => {
  const { sessionKey } = getState().auth;
  const waiting = getState().pendingWrite.writes.filter(({ status }) => !WAITING_FOR_USER.includes(status));

  return Promise.all(
    waiting.map(async (write) => ({
      operation: write.operation,
      wasLookedUp: write.status === 'checking',
      result: await dispatch(
        write.status === 'checking'
          ? checkLegacyCreate(write, sessionKey)
          : settleWrite(inSession(write.operation, sessionKey)),
      ),
    })),
  );
};

// The user's call for a create the server has no trace of after its key ran out: the same operation id again.
export const sendPendingWriteAgain =
  (key: string): AppThunk<Promise<WriteResult | null>> =>
  async (dispatch, getState) => {
    const write = selectPendingWrite(getState(), key);
    if (write?.status !== 'expired') return null;

    return dispatch(
      settleWrite(inSession({ ...write.operation, firstSentAt: Date.now() }, getState().auth.sessionKey)),
    );
  };
