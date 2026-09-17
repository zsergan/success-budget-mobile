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
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    return await getCategories(spaceId);
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const editCategory = createAppAsyncThunk(
  'category/updateCategory',
  async (data: { categoryId: number; categoryData: UpdateCategoryRequest }, thunkAPI) => {
    const spaceId = thunkAPI.getState().space.currentSpaceId;

    if (spaceId === null) {
      return thunkAPI.rejectWithValue(undefined);
    }

    try {
      const response = await updateCategory(spaceId, data.categoryId, data.categoryData);

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
    const spaceId = thunkAPI.getState().space.currentSpaceId;

    if (spaceId === null) {
      return thunkAPI.rejectWithValue(undefined);
    }

    try {
      const response = await createCategory(spaceId, data);

      thunkAPI.dispatch(fetchCategories());

      return response;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);

export const deleteCategory = createAppAsyncThunk('category/deleteCategory', async (categoryId: number, thunkAPI) => {
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    const response = await deleteCategoryRequest(spaceId, categoryId);

    thunkAPI.dispatch(fetchCategories());

    return response;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const reorderCategories = createAppAsyncThunk(
  'category/reorderCategories',
  async (categoryIds: number[], thunkAPI) => {
    const spaceId = thunkAPI.getState().space.currentSpaceId;

    if (spaceId === null) {
      return thunkAPI.rejectWithValue(undefined);
    }

    try {
      await reorderCategoriesRequest(spaceId, categoryIds);

      thunkAPI.dispatch(fetchCategories());
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getRejectValue(error));
    }
  },
);
