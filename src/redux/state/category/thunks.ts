import type { CreateCategoryRequest, UpdateCategoryRequest } from '@api/dto';
import {
  getCategories,
  updateCategory,
  createCategory,
  deleteCategory as deleteCategoryRequest,
  reorderCategories as reorderCategoriesRequest,
} from '@api/category.api';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

export const fetchCategories = createAppAsyncThunk('category/fetchCategories', async (_: void, thunkAPI) => {
  try {
    return await getCategories();
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const editCategory = createAppAsyncThunk(
  'category/updateCategory',
  async (data: { categoryId: number; categoryData: UpdateCategoryRequest }, thunkAPI) => {
    try {
      const response = await updateCategory(data.categoryId, data.categoryData);

      thunkAPI.dispatch(fetchCategories());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);

export const addCategory = createAppAsyncThunk(
  'category/createCategory',
  async (data: CreateCategoryRequest, thunkAPI) => {
    try {
      const response = await createCategory(data);

      thunkAPI.dispatch(fetchCategories());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);

export const deleteCategory = createAppAsyncThunk('category/deleteCategory', async (categoryId: number, thunkAPI) => {
  try {
    const response = await deleteCategoryRequest(categoryId);

    thunkAPI.dispatch(fetchCategories());

    return response;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const reorderCategories = createAppAsyncThunk(
  'category/reorderCategories',
  async (categoryIds: number[], thunkAPI) => {
    try {
      await reorderCategoriesRequest(categoryIds);

      thunkAPI.dispatch(fetchCategories());
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);
