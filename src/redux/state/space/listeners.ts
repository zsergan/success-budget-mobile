import { isRejectedWithValue } from '@reduxjs/toolkit';

import type { ErrorResponse } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import { baseApi, spaceIdOfArg } from '@redux/api/baseApi';
import type { AppListener } from '@redux/Store';
import { spaceApi } from './api';
import { selectProfileId } from '../profile/selectors';
import { pickFallbackSpaceId, selectSpacesResult } from './selectors';
import { persistActiveSpace } from './storage';
import { activateSpace, dropSpaceData, loseSpaceAccess, spaceSelected } from './thunks';

const TRANSACTION_WRITES = ['createTransaction', 'updateTransaction', 'deleteTransaction'];

// Keeps a valid space selected as the spaces list arrives: picks one when
// none is selected, and moves off a space the user no longer belongs to.
export const startSpaceSelectionListener = (listener: AppListener) => {
  listener.startListening({
    matcher: spaceApi.endpoints.getSpaces.matchFulfilled,
    effect: (action, { dispatch, getState }) => {
      const state = getState();
      const { currentSpaceId, selectedAt } = state.space;
      const { requestId, startedTimeStamp = 0 } = selectSpacesResult(state);

      if (requestId !== action.meta.requestId) return;

      if (currentSpaceId !== null) {
        // A list requested before this selection was made (e.g. just before a
        // space was created) can't say whether the selection is still valid.
        if (startedTimeStamp <= selectedAt) return;
        if (action.payload.some((space) => space.id === currentSpaceId)) return;
      }

      dispatch(activateSpace(pickFallbackSpaceId(action.payload)));
      if (currentSpaceId !== null) dispatch(dropSpaceData(currentSpaceId));
    },
  });

  // A read or a write refused with FORBIDDEN_SPACE ends that space at once; any other 403 of a read for the current
  // space is checked against a fresh spaces list instead of being retried.
  listener.startListening({
    predicate: (action) => {
      if (!isRejectedWithValue(action)) return false;

      const isRead = action.type.startsWith(`${baseApi.reducerPath}/executeQuery/`);
      // Transaction writes report a lost space themselves, once they know it is not a stale answer.
      const isWrite =
        action.type.startsWith(`${baseApi.reducerPath}/executeMutation/`) &&
        !TRANSACTION_WRITES.includes((action.meta.arg as { endpointName?: string }).endpointName ?? '');
      const error = action.payload as Partial<ErrorResponse> | undefined;

      return (
        error?.statusCode === 403 &&
        !error.isStale &&
        (isRead || (isWrite && error.code === ApiErrorCode.FORBIDDEN_SPACE))
      );
    },
    effect: (action, { dispatch, getState }) => {
      const { code } = action.payload as Partial<ErrorResponse>;
      const spaceId = spaceIdOfArg(
        (action as unknown as { meta: { arg: { originalArgs?: unknown } } }).meta.arg.originalArgs,
      );

      if (spaceId === undefined) return;
      if (code === ApiErrorCode.FORBIDDEN_SPACE) dispatch(loseSpaceAccess(spaceId));
      else if (spaceId === getState().space.currentSpaceId) dispatch(spaceApi.util.invalidateTags(['Spaces']));
    },
  });
};

// Remembers the active space for the account that chose it. A logout resets the slice without this action, so the
// preference outlives the session; a failed write is left alone, the selection itself never waits for storage.
export const startActiveSpacePersistence = (listener: AppListener) => {
  listener.startListening({
    actionCreator: spaceSelected,
    effect: ({ payload }, { getState }) => {
      const userId = selectProfileId(getState());

      if (userId !== undefined) void persistActiveSpace(userId, payload.spaceId);
    },
  });
};
