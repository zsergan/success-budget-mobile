import { createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import { spaceContextChanged } from '../space/thunks';
import initialState from './initialState';
import { addCategory, deleteCategory, editCategory, fetchCategories, reorderCategories } from './thunks';

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(spaceContextChanged, (state) => ({ ...initialState, hasLoaded: state.hasLoaded, isLoading: true }));

    builder.addCase(fetchCategories.pending, (state, action) => {
      state.isLoading = true;
      state.error = undefined;
      state.requestId = action.meta.requestId;
    });

    // Guarded like fulfilled below -- an older fetchCategories rejecting
    // after a newer one has already taken over must not overwrite `error`
    // with a stale failure.
    builder.addCase(fetchCategories.rejected, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.isLoading = false;
      state.error = action.payload;
    });

    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.incomes = action.payload.incomes;
      state.expenses = action.payload.expenses;
      state.archived = action.payload.archived;
      state.isLoading = false;
      state.hasLoaded = true;
    });

    builder.addCase(deleteCategory.pending, (state) => {
      state.isDeleting = true;
    });

    builder.addCase(deleteCategory.fulfilled, (state) => {
      state.isDeleting = false;
    });

    builder.addCase(deleteCategory.rejected, (state) => {
      state.isDeleting = false;
    });

    builder.addMatcher(isPending(editCategory, addCategory, deleteCategory, reorderCategories), (state) => {
      state.error = undefined;
    });

    builder.addMatcher(isRejected(editCategory, addCategory, deleteCategory, reorderCategories), (state, action) => {
      state.error = action.payload;
    });
  },
});

export default categorySlice.reducer;
