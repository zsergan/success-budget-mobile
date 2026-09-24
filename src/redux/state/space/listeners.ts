import type { ListenerMiddlewareInstance } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';
import { spaceApi } from './api';
import { pickFallbackSpaceId, selectSpacesResult } from './selectors';
import { activateSpace } from './thunks';

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
    },
  });
};
