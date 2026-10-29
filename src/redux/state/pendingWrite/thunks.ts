import type { AppThunk } from '@redux/Store';
import { selectProfileId } from '../profile/selectors';
import type { StoredOperation, TransactionOperation, WriteResult } from '../transaction/operations';
import { settleWrite } from '../transaction/operations';
import { selectPendingWrite } from './selectors';
import { writesRestored } from './slice';
import { readPendingWrites } from './storage';

export const inSession = (operation: StoredOperation, sessionKey: number): TransactionOperation =>
  Object.freeze({ ...operation, sessionKey });

// Writes left unsettled by a closed form, a lost connection or a restart; the user's own, never another's.
export const restorePendingWrites =
  (userId: number): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const writes = await readPendingWrites(userId);

    if (selectProfileId(getState()) === userId) dispatch(writesRestored({ userId, writes }));
  };

export interface ResumedWrite {
  operation: StoredOperation;
  result: WriteResult;
}

// Sends every unsettled write again with its own key, or looks up a create whose key ran out. An expired create
// waits for the user.
export const resumePendingWrites = (): AppThunk<Promise<ResumedWrite[]>> => (dispatch, getState) => {
  const { sessionKey } = getState().auth;
  const waiting = getState().pendingWrite.writes.filter(({ status }) => status !== 'expired');

  return Promise.all(
    waiting.map(async ({ operation }) => ({
      operation,
      result: await dispatch(settleWrite(inSession(operation, sessionKey))),
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
