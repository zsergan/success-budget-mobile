import { createAction } from '@reduxjs/toolkit';

import type { CreateSpaceRequest } from '@api/dto';
import { getSpaces, createSpace, deleteSpace } from '@api/space.api';
import { SpaceType } from '@shared/enums';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

// Switching the current space is local, synchronous UI state, not a network
// call -- a plain action rather than an async thunk with nothing to await.
export const setCurrentSpaceId = createAction<number>('space/setCurrentSpaceId');

export const fetchSpaces = createAppAsyncThunk('space/fetchSpaces', async (_: void, thunkAPI) => {
  try {
    const spaces = await getSpaces();
    const previousSpaceId = thunkAPI.getState().space.currentSpaceId;
    const stillValid = previousSpaceId !== null && spaces.some((space) => space.id === previousSpaceId);

    if (stillValid) {
      return { spaces, currentSpaceId: previousSpaceId };
    }

    const personalSpace = spaces.find((space) => space.type === SpaceType.PERSONAL);

    if (!personalSpace) {
      return thunkAPI.rejectWithValue(undefined);
    }

    return { spaces, currentSpaceId: personalSpace.id };
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const addSpace = createAppAsyncThunk('space/addSpace', async (data: CreateSpaceRequest, thunkAPI) => {
  try {
    const space = await createSpace(data);

    thunkAPI.dispatch(setCurrentSpaceId(space.id));
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
