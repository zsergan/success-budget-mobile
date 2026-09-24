import { createAction } from '@reduxjs/toolkit';

import type { CreateSpaceRequest, SpaceSummary } from '@api/dto';
import type { AppThunk, RootState } from '@redux/Store';
import { spaceApi } from './api';

// The one event that means "the active space identity changed". Slices that
// still hold space data (member) listen for this (not just `currentSpaceId`)
// to synchronously drop the previous space's data and reject in-flight
// responses that belong to it -- see `contextKey` on space/initialState.
export const spaceContextChanged = createAction(
  'space/contextChanged',
  (payload: { spaceId: number | null; contextKey: number }) => ({ payload: { ...payload, selectedAt: Date.now() } }),
);

// The only way `currentSpaceId` should change. Selecting the space that's
// already active is a deliberate no-op: it must not reset forms/dialogs or
// re-trigger every fetch.
export const activateSpace =
  (spaceId: number | null): AppThunk =>
  (dispatch, getState) => {
    const { currentSpaceId, contextKey } = getState().space;

    if (spaceId === currentSpaceId) return;

    dispatch(spaceContextChanged({ spaceId, contextKey: contextKey + 1 }));
  };

// For a mutation thunk that captured space.contextKey before its request:
// after the await, this tells it whether the space is still the one the
// request actually ran against.
export const isSpaceContextCurrent = (getState: () => RootState, contextKey: number) =>
  getState().space.contextKey === contextKey;

// Creating a space selects it, but only for the session that asked: a
// request that outlived a logout must not pick a space for the next one.
// The spaces list refreshes separately, through the Spaces tag.
export const createSpaceAndSelect =
  (data: CreateSpaceRequest): AppThunk<Promise<SpaceSummary>> =>
  async (dispatch, getState) => {
    const { sessionKey } = getState().auth;
    const space = await dispatch(spaceApi.endpoints.createSpace.initiate(data, { track: false })).unwrap();

    if (getState().auth.sessionKey === sessionKey) {
      dispatch(activateSpace(space.id));
    }

    return space;
  };
