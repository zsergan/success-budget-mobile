import { createAction } from '@reduxjs/toolkit';

import type { CreateSpaceRequest } from '@api/dto';
import { getSpaces, createSpace, deleteSpace } from '@api/space.api';
import { SpaceType } from '@shared/enums';
import type { AppThunk, RootState } from '@redux/Store';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

// The one event that means "the active space identity changed". wallet,
// category, limit, transaction and member all listen for this (not just
// `currentSpaceId`) to synchronously drop the previous space's data and
// reject in-flight responses that belong to it -- see `contextKey` on
// space/initialState for why a plain id comparison isn't enough.
export const spaceContextChanged = createAction<{ spaceId: number | null; contextKey: number }>('space/contextChanged');

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
// request actually ran against -- false means the user switched (or
// logged out) while it was in flight, so its result must not drive a
// refresh, revision bump, or any other now-irrelevant side effect.
export const isSpaceContextCurrent = (getState: () => RootState, contextKey: number) =>
  getState().space.contextKey === contextKey;

const pickFallbackSpaceId = (spaces: { id: number; type: SpaceType }[]): number | null => {
  if (spaces.length === 0) return null;

  const personalSpace = spaces.find((space) => space.type === SpaceType.PERSONAL);

  if (personalSpace) return personalSpace.id;

  // No personal space (a group-only account, or it was just left/deleted) --
  // fall back to the lowest id so the pick is deterministic rather than
  // whatever order the backend happened to return.
  return spaces.reduce((lowest, space) => (space.id < lowest.id ? space : lowest)).id;
};

export const fetchSpaces = createAppAsyncThunk('space/fetchSpaces', async (_: void, thunkAPI) => {
  try {
    const spaces = await getSpaces();

    // A newer fetchSpaces (or an explicit activateSpace the user made
    // directly) may have already superseded this one -- only the request
    // the slice still considers "current" gets to decide the fallback
    // activation. Otherwise this response is stale data (it may not even
    // include a space the user has since switched to) and must not act.
    if (thunkAPI.getState().space.requestId === thunkAPI.requestId) {
      const { currentSpaceId } = thunkAPI.getState().space;
      const stillValid = currentSpaceId !== null && spaces.some((space) => space.id === currentSpaceId);

      thunkAPI.dispatch(activateSpace(stillValid ? currentSpaceId : pickFallbackSpaceId(spaces)));
    }

    return spaces;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const addSpace = createAppAsyncThunk('space/addSpace', async (data: CreateSpaceRequest, thunkAPI) => {
  try {
    const space = await createSpace(data);

    thunkAPI.dispatch(activateSpace(space.id));
    thunkAPI.dispatch(fetchSpaces());

    return space;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const removeSpace = createAppAsyncThunk('space/removeSpace', async (spaceId: number, thunkAPI) => {
  try {
    await deleteSpace(spaceId);

    thunkAPI.dispatch(fetchSpaces());
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});
