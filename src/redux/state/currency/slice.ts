import { createSlice } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { fetchCurrencies } from './thunks';

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(fetchCurrencies.pending, (state) => {
      state.isLoading = true;
      state.error = undefined;
    });

    builder.addCase(fetchCurrencies.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    builder.addCase(fetchCurrencies.fulfilled, (state, action) => {
      state.currencies = action.payload;
      state.isLoading = false;
    });
  },
});

export default currencySlice.reducer;
