import { createAction } from '@reduxjs/toolkit';
import type { QueryCacheKey } from '@reduxjs/toolkit/query';

import type { CreateSpaceRequest, SpaceSummary } from '@api/dto';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi } from '@redux/api/baseApi';
import type { AppThunk } from '@redux/Store';
import { memberApi } from '../member/api';
import { selectProfileId } from '../profile/selectors';
import { spaceApi } from './api';
import { pickFallbackSpaceId, selectSpaces } from './selectors';

export const spaceSelected = createAction('space/selected', (spaceId: number | null) => ({
  payload: { spaceId, selectedAt: Date.now() },
}));

// The only way `currentSpaceId` should change. Selecting the space that's
// already active is a deliberate no-op: it must not reset forms/dialogs.
export const activateSpace =
  (spaceId: number | null): AppThunk =>
  (dispatch, getState) => {
    if (spaceId === getState().space.currentSpaceId) return;

    dispatch(spaceSelected(spaceId));
  };

export const spaceAccessLost = createAction<{ spaceId: number }>('space/accessLost');

// Nothing cached for a space the user no longer belongs to stays, and its open transaction ends.
export const dropSpaceData =
  (spaceId: number): AppThunk =>
  (dispatch, getState) => {
    dispatch(spaceAccessLost({ spaceId }));

    Object.entries(getState()[baseApi.reducerPath].queries).forEach(([queryCacheKey, entry]) => {
      if ((entry?.originalArgs as Partial<SpaceArg> | undefined)?.spaceId === spaceId) {
        dispatch(baseApi.internalActions.removeQueryResult({ queryCacheKey: queryCacheKey as QueryCacheKey }));
      }
    });
  };

// The server refused the space itself (the user was removed, or it was deleted): its data goes at once, and the
// refreshed spaces list moves the selection to one the user still has.
export const loseSpaceAccess =
  (spaceId: number): AppThunk =>
  (dispatch) => {
    dispatch(dropSpaceData(spaceId));
    dispatch(spaceApi.util.invalidateTags(['Spaces']));
  };

// A request that outlived a logout must not select a space for the next session.

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

export const acceptInviteAndSelect =
  (code: string): AppThunk<Promise<SpaceSummary>> =>
  async (dispatch, getState) => {
    const { sessionKey } = getState().auth;
    const space = await dispatch(memberApi.endpoints.acceptInvite.initiate(code, { track: false })).unwrap();

    if (getState().auth.sessionKey === sessionKey) {
      dispatch(activateSpace(space.id));
    }

    return space;
  };

// Resolves `movedOff: true` when it switched the user off the space they
// left; false when they had already switched away (or logged out) meanwhile.
export const leaveCurrentSpace = (): AppThunk<Promise<{ movedOff: boolean }>> => async (dispatch, getState) => {
  const { space, auth } = getState();
  const spaceId = space.currentSpaceId;
  const userId = selectProfileId(getState());

  if (spaceId === null || userId === undefined) {
    throw new Error('Could not leave this space. Please try again.');
  }

  // Taken before the request: its success invalidates (and may evict) the cached list.
  const remaining = selectSpaces(getState()).filter(({ id }) => id !== spaceId);

  await dispatch(memberApi.endpoints.leaveSpace.initiate({ spaceId, userId }, { track: false })).unwrap();

  const after = getState();

  if (after.auth.sessionKey !== auth.sessionKey || after.space.currentSpaceId !== spaceId) {
    return { movedOff: false };
  }

  dispatch(activateSpace(pickFallbackSpaceId(remaining)));

  return { movedOff: true };
};
