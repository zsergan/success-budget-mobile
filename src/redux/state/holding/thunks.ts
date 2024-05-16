import { createAsyncThunk } from '@reduxjs/toolkit';

import { getHoldings } from '@api/holding.api';

export const fetchHoldings = createAsyncThunk('holding/fetchHoldings', async () => {
  return await getHoldings();
});
