import { useMemo, useState } from 'react';

import type { CategoryModel } from '@api/models';
import { requireSpaceId } from '@redux/api/baseApi';
import { getLoadState } from '@redux/api/loadState';
import { useAppSelector, useSessionGuard, useSpaceArg } from '@redux/hooks';
import {
  useGetCategoriesQuery,
  useReorderCategoriesMutation,
  useUpdateCategoryMutation,
} from '@redux/state/category/api';
import { EMPTY_CATEGORIES } from '@redux/state/category/selectors';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
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
  const { addAlert } = useAlert();
  const captureSession = useSessionGuard();
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const categoriesQuery = useGetCategoriesQuery(useSpaceArg());
  const { currentData, refetch } = categoriesQuery;
  const { isLoading, hasError } = getLoadState(categoriesQuery);
  const { incomes, expenses, archived } = currentData ?? EMPTY_CATEGORIES;
  const [reorderCategories] = useReorderCategoriesMutation();
  const [updateCategory] = useUpdateCategoryMutation();

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

  const handleReorder = async (orderedCategories: CategoryModel[]) => {
    const isSessionCurrent = captureSession();

    try {
      await reorderCategories({
        spaceId: requireSpaceId(spaceId),
        categoryIds: orderedCategories.map((category) => category.id),
      }).unwrap();
    } catch (error: unknown) {
      if (isSessionCurrent()) addAlert(getErrorMessage(error));
    }
  };

  const handleRestore = async (category: CategoryModel) => {
    const isSessionCurrent = captureSession();

    try {
      await updateCategory({
        spaceId: requireSpaceId(spaceId),
        categoryId: category.id,
        data: { is_active: 1 },
      }).unwrap();
    } catch (error: unknown) {
      if (isSessionCurrent()) addAlert(getErrorMessage(error));
    }
  };

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
    hasError,
    retry: refetch,
    handleReorder,
    handleRestore,
    defaultTransactionType: segment === 'archived' ? TransactionType.EXPENSE : SEGMENT_TO_TRANSACTION_TYPE[segment],
  };
};

export default useCategoryList;
