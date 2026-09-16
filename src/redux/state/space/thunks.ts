import { getSpaces } from '@api/space.api';
import { SpaceType } from '@shared/enums';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

export const fetchSpaces = createAppAsyncThunk('space/fetchSpaces', async (_: void, thunkAPI) => {
  try {
    const spaces = await getSpaces();
    const personalSpace = spaces.find((space) => space.type === SpaceType.PERSONAL);

    if (!personalSpace) {
      return thunkAPI.rejectWithValue(undefined);
    }

    return { spaces, currentSpaceId: personalSpace.id };
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});
