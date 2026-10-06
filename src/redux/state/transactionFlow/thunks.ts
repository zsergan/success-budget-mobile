import type { ErrorResponse } from '@api/dto';
import type { TransactionModel } from '@api/models';
import { spaceTags } from '@redux/api/baseApi';
import type { AppThunk } from '@redux/Store';
import { loseSpaceAccess } from '../space/thunks';
import { transactionApi } from '../transaction/api';
import { classifyTransactionError, submitTransactionRequest } from '../transaction/operations';
import { selectIsDeleting, selectTransactionFlow } from './selectors';
import type { DeleteResult } from './slice';
import {
  checkFailed,
  checkStarted,
  deleteSettled,
  deleteStarted,
  detailsOpened,
  latestLoaded,
  recordChecked,
  recordGone,
} from './slice';

// `failed`: no answer, or one that says nothing about the record; what is on screen stays.
export type ReadOutcome = 'read' | 'gone' | 'failed' | 'stale';

// Reads the open record from the server. A record deleted elsewhere ends the flow on its own view and refreshes
// the lists it was in; a space the user lost is dropped.
const readFlowRecord =
  (onRead: typeof recordChecked | typeof latestLoaded): AppThunk<Promise<ReadOutcome>> =>
  async (dispatch, getState) => {
    const flow = selectTransactionFlow(getState());
    if (!flow?.saved) return 'stale';

    const { draftId, spaceId, saved } = flow;
    const { data, error } = await dispatch(
      transactionApi.endpoints.getTransaction.initiate(
        { spaceId, transactionId: saved.id },
        { subscribe: false, forceRefetch: true },
      ),
    );

    if (selectTransactionFlow(getState())?.draftId !== draftId) return 'stale';

    if (data) {
      dispatch(onRead({ draftId, transaction: data }));
      return 'read';
    }

    if ((error as Partial<ErrorResponse> | undefined)?.isStale) return 'stale';

    switch (classifyTransactionError(error)) {
      case 'notFound':
        dispatch(recordGone({ draftId }));
        dispatch(
          transactionApi.util.invalidateTags(spaceTags(spaceId, 'Transactions', 'Wallets', 'Limits', 'Categories')),
        );
        return 'gone';
      case 'accessLost':
        dispatch(loseSpaceAccess(spaceId));
        return 'stale';
      default:
        return 'failed';
    }
  };

// Until the record is read again, the details show what the list had and offer nothing that acts on it.
export const checkFlowRecord = (): AppThunk<Promise<ReadOutcome>> => async (dispatch, getState) => {
  const flow = selectTransactionFlow(getState());
  if (!flow) return 'stale';

  dispatch(checkStarted({ draftId: flow.draftId }));
  const outcome = await dispatch(readFlowRecord(recordChecked));

  if (outcome === 'failed') dispatch(checkFailed({ draftId: flow.draftId }));

  return outcome;
};

// The user's explicit choice after a conflict: the latest version replaces what the form held.
export const loadLatestRecord = (): AppThunk<Promise<ReadOutcome>> => (dispatch) =>
  dispatch(readFlowRecord(latestLoaded));

export const openTransactionDetails =
  (payload: { spaceId: number; transaction: TransactionModel }): AppThunk =>
  (dispatch, getState) => {
    dispatch(detailsOpened(payload));

    if (selectTransactionFlow(getState())?.saved === payload.transaction) void dispatch(checkFlowRecord());
  };

// A deleted row leaves every cached list of its space at once; the refetch that follows recounts the totals.
const dropFromLists =
  (spaceId: number, transactionId: string): AppThunk =>
  (dispatch, getState) => {
    transactionApi.util
      .selectCachedArgsForQuery(getState(), 'getTransactions')
      .filter((arg) => arg.spaceId === spaceId)
      .forEach((arg) =>
        dispatch(
          transactionApi.util.updateQueryData('getTransactions', arg, (rows) =>
            rows.filter(({ id }) => id !== transactionId),
          ),
        ),
      );
  };

// The one delete behind a list row and the sheet. Every attempt may use a new key: a delete that already applied
// answers 404 on a retry, which counts as done.
export const deleteTransaction =
  ({ spaceId, transaction }: { spaceId: number; transaction: TransactionModel }): AppThunk<Promise<DeleteResult>> =>
  async (dispatch, getState) => {
    const transactionId = transaction.id;
    if (selectIsDeleting(getState(), transactionId)) return 'stale';

    dispatch(deleteStarted({ transactionId }));
    const { outcome } = await dispatch(
      submitTransactionRequest({ type: 'delete', spaceId, transactionId, version: transaction.version }, null),
    );

    const result: DeleteResult =
      outcome.status === 'succeeded'
        ? 'deleted'
        : outcome.status === 'stale' || outcome.failure.kind === 'accessLost'
          ? 'stale'
          : outcome.failure.kind === 'conflict'
            ? 'conflict'
            : 'failed';

    if (result === 'deleted') dispatch(dropFromLists(spaceId, transactionId));
    dispatch(deleteSettled({ transactionId, result }));

    return result;
  };
