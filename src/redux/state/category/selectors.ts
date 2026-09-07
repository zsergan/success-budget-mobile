import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';

const baseSelect = (state: RootState) => state.category;

export const selectCategory = baseSelect;

export const selectActiveCategories = createSelector(baseSelect, (state) => {
  const activeIncomes = state.incomes.filter((income) => income.isActive);
  const activeExpenses = state.expenses.filter((expense) => expense.isActive);

  return { incomes: activeIncomes, expenses: activeExpenses, isLoading: state.isLoading };
});

export const selectArchivedCategories = createSelector(baseSelect, (state) => state.archived);
