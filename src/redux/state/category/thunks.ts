import { createAsyncThunk } from '@reduxjs/toolkit';

import { getCategories } from '@api/category.api';

export const fetchCategories = createAsyncThunk('category/fetchCategories', async () => {
  return await getCategories();
});
