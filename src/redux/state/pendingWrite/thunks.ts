import { TRANSACTION_WRITE_TAGS, transactionApi } from '@redux/state/transaction/api';
import { spaceTags } from '@redux/api/baseApi';
import type { AppThunk } from '@redux/Store';
import { selectProfileId } from '../profile/selectors';
import { loseSpaceAccess } from '../space/thunks';
import type { StoredOperation, TransactionOperation, WriteResult } from '../transaction/operations';
import { classifyTransactionError, lookUpCreate, settleWrite } from '../transaction/operations';
import type { RetiredEdit } from './legacy';
import { selectPendingWrite } from './selectors';
import type { PendingWrite } from './slice';
import { WAITING_FOR_USER, writeSettled, writesRestored } from './slice';
import { persistPendingWrites, readPendingWrites } from './storage';

export const inSession = (operation: StoredOperation, sessionKey: number): TransactionOperation =>
  Object.freeze({ ...operation, sessionKey });

// Writes left unsettled by a closed form, a lost connection or a restart; the user's own, never another's. Edits an
// older build left that only changed a wallet come back so the user can be told they were not kept.
export const restorePendingWrites =
  (userId: number): AppThunk<Promise<RetiredEdit[]>> =>
  async (dispatch, getState) => {
    const { writes, retiredEdits } = await readPendingWrites(userId);
    if (selectProfileId(getState()) !== userId) return [];

    dispatch(writesRestored({ userId, writes }));
    retiredEdits.forEach(({ spaceId }) =>
      dispatch(transactionApi.util.invalidateTags(spaceTags(spaceId, ...TRANSACTION_WRITE_TAGS))),
    );

    return retiredEdits;
  };

export interface ResumedWrite {
  operation: StoredOperation;
  result: WriteResult;
  // An older build's create, only looked up: what it found is offered in place rather than reported.
  wasLookedUp: boolean;
}

// An older build's create, asked about by its operation id in the space it was made in, before anything is sent: it
// had applied, it applied and was deleted since, nothing applied, or there is no answer yet.
const checkLegacyCreate =
  (write: PendingWrite, sessionKey: number): AppThunk<Promise<WriteResult>> =>
  async (dispatch, getState) => {
    const operation = inSession(write.operation, sessionKey);
    const userId = getState().pendingWrite.userId;
    const result = await dispatch(lookUpCreate(operation, { kind: 'expired' }));

    if (result.kind === 'stale' || getState().pendingWrite.userId !== userId) return result;

    const key = operation.idempotencyKey;
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
