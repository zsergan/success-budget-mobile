import type { ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { isRejectedWithValue } from '@reduxjs/toolkit';

import type { ErrorResponse } from '@api/dto';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi } from '@redux/api/baseApi';
import type { RootState } from '@redux/Store';
import { spaceApi } from './api';
import { pickFallbackSpaceId, selectSpacesResult } from './selectors';
import { activateSpace, dropSpaceData } from './thunks';

// Keeps a valid space selected as the spaces list arrives: picks one when
// none is selected, and moves off a space the user no longer belongs to.
export const startSpaceSelectionListener = (listener: ListenerMiddlewareInstance<RootState>) => {
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

  // A read refused for the current space is checked against a fresh spaces list instead of being retried.
  listener.startListening({
    predicate: (action, state) => {
      if (!isRejectedWithValue(action) || !action.type.startsWith(`${baseApi.reducerPath}/executeQuery/`)) return false;

      const error = action.payload as Partial<ErrorResponse> | undefined;
      const arg = (action.meta.arg as { originalArgs?: Partial<SpaceArg> }).originalArgs;

      return error?.statusCode === 403 && !error.isStale && arg?.spaceId === state.space.currentSpaceId;
    },
    effect: (_action, { dispatch }) => {
      dispatch(spaceApi.util.invalidateTags(['Spaces']));
    },
  });
};
