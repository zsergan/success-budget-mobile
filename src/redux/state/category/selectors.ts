import type { CategoriesModel } from '@api/models';

export const EMPTY_CATEGORIES: CategoriesModel = { incomes: [], expenses: [], archived: [] };

export const getActiveCategories = (categories: CategoriesModel = EMPTY_CATEGORIES) => ({
  incomes: categories.incomes.filter((income) => income.isActive),
  expenses: categories.expenses.filter((expense) => expense.isActive),
});
