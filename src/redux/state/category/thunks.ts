import type { AxiosError } from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

import type { CreateCategoryRequest, ErrorResponse, UpdateCategoryRequest } from '@api/dto';
import { getCategories, updateCategory, createCategory, moveCategoryForward } from '@api/category.api';

export const fetchCategories = createAsyncThunk('category/fetchCategories', async () => await getCategories());

export const editCategory = createAsyncThunk(
  'category/updateCategory',
  async (data: { categoryId: number; categoryData: UpdateCategoryRequest }, thunkAPI) => {
    try {
      const response = await updateCategory(data.categoryId, data.categoryData);

      thunkAPI.dispatch(fetchCategories());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue((error as AxiosError<ErrorResponse>).response?.data);
    }
  },
);

export const addCategory = createAsyncThunk(
  'category/createCategory',
  async (data: CreateCategoryRequest, thunkAPI) =>
    await createCategory(data).then(() => thunkAPI.dispatch(fetchCategories())),
);

export const sortCategoryForward = createAsyncThunk(
  'category/sortCategoryForward',
  async (categoryId: number, thunkAPI) =>
    await moveCategoryForward(categoryId).then(() => thunkAPI.dispatch(fetchCategories())),
);
