import { createSlice } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { fetchCategories } from './thunks';

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(fetchCategories.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(fetchCategories.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.incomes = action.payload.incomes;
      state.expenses = action.payload.expenses;
      state.isLoading = false;
    });
  },
});

export default categorySlice.reducer;
