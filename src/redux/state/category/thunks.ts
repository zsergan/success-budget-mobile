import { createAsyncThunk } from '@reduxjs/toolkit';

import type { CreateCategoryRequest, UpdateCategoryRequest } from '@api/dto';
import { getCategories, updateCategory, createCategory } from '@api/category.api';

export const fetchCategories = createAsyncThunk('category/fetchCategories', async () => {
  return await getCategories();
});

export const editCategory = createAsyncThunk(
  'category/updateCategory',
  async (data: { categoryId: number; categoryData: UpdateCategoryRequest }, thunkAPI) => {
    return await updateCategory(data.categoryId, data.categoryData).then(() => {
      thunkAPI.dispatch(fetchCategories());
    });
  },
);

export const addCategory = createAsyncThunk(
  'category/createCategory',
  async (data: CreateCategoryRequest, thunkAPI) => {
    return await createCategory(data).then(() => {
      thunkAPI.dispatch(fetchCategories());
    });
  },
);
