import type { CategoryModel } from '@api/models';
import { AppColor, TransactionType } from '@shared/enums';
import { logoutMe } from '../auth/thunks';
import categoryReducer from './slice';
import initialState from './initialState';
import { addCategory, deleteCategory, editCategory, fetchCategories, reorderCategories } from './thunks';

const category: CategoryModel = {
  id: 1,
  name: 'Groceries',
  transactionType: TransactionType.EXPENSE,
  icon: 'grocery',
  color: AppColor.SLATE,
  isActive: true,
  transactionCount: 0,
  limit: null,
  archivedAt: null,
};

const errorResponse = {
  message: 'Enter a category name',
  statusCode: 400,
  path: '/categories',
  timestamp: '2026-01-01T00:00:00.000Z',
};

describe('category slice', () => {
  it('returns the initial state by default', () => {
    expect(categoryReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('stores incomes, expenses and archived on fetchCategories.fulfilled', () => {
    const payload = { incomes: [], expenses: [category], archived: [{ ...category, id: 2, isActive: false }] };
    const pending = categoryReducer(initialState, fetchCategories.pending('req-1', undefined));

    const state = categoryReducer(pending, fetchCategories.fulfilled(payload, 'req-1', undefined));

    expect(state.expenses).toEqual(payload.expenses);
    expect(state.archived).toEqual(payload.archived);
    expect(state.isLoading).toBe(false);
  });

  it('tracks isDeleting across a deleteCategory request', () => {
    const pending = categoryReducer(initialState, deleteCategory.pending('req-2', 1));

    expect(pending.isDeleting).toBe(true);

    const fulfilled = categoryReducer(pending, deleteCategory.fulfilled({ archived: true }, 'req-2', 1));

    expect(fulfilled.isDeleting).toBe(false);
  });

  it('records the server error on a rejected category thunk (fetch, add, edit, delete, or reorder)', () => {
    const state = categoryReducer(
      initialState,
      addCategory.rejected(
        new Error('request failed'),
        'req-3',
        { name: '', transaction_type: TransactionType.EXPENSE, icon: 'Other', color: AppColor.SLATE },
        errorResponse,
      ),
    );

    expect(state.error).toEqual(errorResponse);
  });

  it('clears a previous error once a new request starts', () => {
    const withError = { ...initialState, error: errorResponse };

    const state = categoryReducer(withError, editCategory.pending('req-4', { categoryId: 1, categoryData: {} }));

    expect(state.error).toBeUndefined();
  });

  it('clears a previous error when a reorder request starts', () => {
    const withError = { ...initialState, error: errorResponse };

    const state = categoryReducer(withError, reorderCategories.pending('req-5', [1, 2]));

    expect(state.error).toBeUndefined();
  });

  it('resets to the initial state on logout, even with categories and an error already loaded', () => {
    const dirtyState = {
      incomes: [],
      expenses: [category],
      archived: [],
      isLoading: false,
      isDeleting: false,
      error: errorResponse,
    };

    const state = categoryReducer(dirtyState, logoutMe.fulfilled(undefined, 'req-6', undefined));

    expect(state).toEqual(initialState);
  });
});
