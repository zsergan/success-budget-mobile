import { createAsyncThunk } from '@reduxjs/toolkit';

import { getProfile } from '@api/profile.api';

export const fetchProfile = createAsyncThunk('profile/fetchProfile', async () => {
  return await getProfile();
});
