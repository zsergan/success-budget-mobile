import { useState } from 'react';

import type { Category } from '@api/dto';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCategory } from '@redux/state/category/selectors';
import { editCategory } from '@redux/state/category/thunks';
import { useAlert } from '@hooks';

const useAllCategories = () => {
  const [longPressedCategory, setLongPressedCategory] = useState<Category | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const dispatch = useAppDispatch();
  const { incomes, expenses } = useAppSelector(selectCategory);
  const { addAlert } = useAlert();

  const handleUpdate = (categoryId: number, categoryName: string, isActive: number) =>
    dispatch(editCategory({ categoryId, categoryData: { is_active: isActive } })).then(() => {
      const message = isActive
        ? `${categoryName} will be in the transaction creation list`
        : `${categoryName} will no longer be in the transaction creation list`;
      addAlert(message);
    });

  const onCategoryLongPress = (category: Category) => {
    setLongPressedCategory(category);
    setIsModalVisible(true);
  };

  const onLongPressCancel = () => {
    setIsModalVisible(false);
  };

  return {
    incomes: incomes || [],
    expenses: expenses || [],
    handleUpdate,
    longPressedCategory,
    onCategoryLongPress,
    onLongPressCancel,
    isModalVisible,
  };
};

export default useAllCategories;
