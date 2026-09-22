import { useMemo, useState } from 'react';

import type { CategoryModel } from '@api/models';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCategory } from '@redux/state/category/selectors';
import { editCategory, fetchCategories, reorderCategories } from '@redux/state/category/thunks';
import { TransactionType } from '@shared/enums';
import { getErrorMessage } from '@shared/utils';
import { useAlert } from '@hooks';

export type CategorySegment = 'expenses' | 'income' | 'archived';
export type SortMode = 'most-used' | 'manual';

const SEGMENT_TO_TRANSACTION_TYPE: Record<Exclude<CategorySegment, 'archived'>, TransactionType> = {
  expenses: TransactionType.EXPENSE,
  income: TransactionType.INCOME,
};

const useCategoryList = () => {
  const dispatch = useAppDispatch();
  const { addAlert } = useAlert();
  const { incomes, expenses, archived, isLoading, error } = useAppSelector(selectCategory);

  const [segment, setSegment] = useState<CategorySegment>('expenses');
  const [sortMode, setSortMode] = useState<SortMode>('most-used');
  const [searchQuery, setSearchQuery] = useState('');

  const listBySegment: Record<CategorySegment, CategoryModel[]> = { expenses, income: incomes, archived };
  const activeList = listBySegment[segment];

  const sortedList = useMemo(() => {
    if (segment === 'archived' || sortMode === 'manual') {
      return activeList;
    }

    return [...activeList].sort((a, b) => b.transactionCount - a.transactionCount);
  }, [activeList, segment, sortMode]);

  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Manual-order drags must submit the segment's complete active id list — never let a filter shrink it.
    if (!query || sortMode === 'manual') {
      return sortedList;
    }

    return sortedList.filter((category) => category.name.toLowerCase().includes(query));
  }, [sortedList, searchQuery, sortMode]);

  const isSearching = searchQuery.trim().length > 0;
  const segmentNoun: Record<CategorySegment, string> = { expenses: 'expense', income: 'income', archived: 'archived' };
  const resultNote = isSearching
    ? `${filteredList.length} of ${activeList.length} ${segmentNoun[segment]} categories`
    : '';

  const changeSegment = (next: CategorySegment) => {
    setSegment(next);
    setSearchQuery('');

    if (next === 'archived') {
      setSortMode('most-used');
    }
  };

  const toggleSortMode = () => {
    // Manual-order drags must submit the segment's complete active id list — clear any filter so it can't shrink it.
    setSearchQuery('');
    setSortMode((mode) => (mode === 'manual' ? 'most-used' : 'manual'));
  };

  const handleReorder = (orderedCategories: CategoryModel[]) => {
    dispatch(reorderCategories(orderedCategories.map((category) => category.id)))
      .unwrap()
      .catch((error: unknown) => addAlert(getErrorMessage(error)));
  };

  const handleRestore = (category: CategoryModel) => {
    dispatch(editCategory({ categoryId: category.id, categoryData: { is_active: 1 } }))
      .unwrap()
      .catch((error: unknown) => addAlert(getErrorMessage(error)));
  };

  const retry = () => dispatch(fetchCategories());

  return {
    segment,
    changeSegment,
    counts: { expenses: expenses.length, income: incomes.length, archived: archived.length },
    sortMode,
    toggleSortMode,
    searchQuery,
    setSearchQuery,
    isSearching,
    resultNote,
    list: filteredList,
    isLoading,
    error,
    retry,
    handleReorder,
    handleRestore,
    defaultTransactionType: segment === 'archived' ? TransactionType.EXPENSE : SEGMENT_TO_TRANSACTION_TYPE[segment],
  };
};

export default useCategoryList;
