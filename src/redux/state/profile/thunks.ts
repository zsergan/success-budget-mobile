import { getProfile } from '@api/profile.api';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

export const fetchProfile = createAppAsyncThunk('profile/fetchProfile', async (_: void, thunkAPI) => {
  try {
    return await getProfile();
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});
