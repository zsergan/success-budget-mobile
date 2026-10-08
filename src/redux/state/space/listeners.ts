import { isRejectedWithValue } from '@reduxjs/toolkit';

import type { ErrorResponse } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi } from '@redux/api/baseApi';
import type { AppListener } from '@redux/Store';
import { spaceApi } from './api';
import { pickFallbackSpaceId, selectSpacesResult } from './selectors';
import { activateSpace, dropSpaceData, loseSpaceAccess } from './thunks';

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
      const spaceId = (action as unknown as { meta: { arg: { originalArgs?: Partial<SpaceArg> } } }).meta.arg
        .originalArgs?.spaceId;

      if (spaceId === undefined) return;
      if (code === ApiErrorCode.FORBIDDEN_SPACE) dispatch(loseSpaceAccess(spaceId));
      else if (spaceId === getState().space.currentSpaceId) dispatch(spaceApi.util.invalidateTags(['Spaces']));
    },
  });
};
