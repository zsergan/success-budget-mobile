import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';

const baseSelect = (state: RootState) => state.category;

export const selectCategory = createSelector(baseSelect, (state) => ({ ...state }));

export const selectActiveCategories = createSelector(baseSelect, (state) => {
  const activeIncomes = state.incomes.filter((income) => income.is_active);
  const activeExpenses = state.expenses.filter((expense) => expense.is_active);

  return { incomes: activeIncomes, expenses: activeExpenses, isLoading: state.isLoading };
});
