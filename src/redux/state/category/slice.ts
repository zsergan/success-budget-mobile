import { createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { addCategory, editCategory, fetchCategories, sortCategoryForward } from './thunks';

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

    builder.addMatcher(isPending(fetchCategories, editCategory, addCategory, sortCategoryForward), (state) => {
      state.error = undefined;
    });

    builder.addMatcher(isRejected(fetchCategories, editCategory, addCategory, sortCategoryForward), (state, action) => {
      state.error = action.payload;
    });
  },
});

export default categorySlice.reducer;
