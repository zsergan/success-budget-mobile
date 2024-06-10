import { useState, useCallback } from 'react';

import type { Category } from '@api/dto';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCategory } from '@redux/state/category/selectors';
import { editCategory, sortCategoryForward } from '@redux/state/category/thunks';
import type { ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { useAlert } from '@hooks';

interface UseAllCategoriesProps extends ScreenProps<ScreenNames.CATEGORIES_SCREEN> {}

const useAllCategories = ({ navigation }: UseAllCategoriesProps) => {
  const [longPressedCategory, setLongPressedCategory] = useState<Category | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const dispatch = useAppDispatch();
  const { incomes, expenses } = useAppSelector(selectCategory);
  const { addAlert } = useAlert();

  const onUpdate = useCallback(
    (categoryId: number) => {
      const category = [...incomes, ...expenses].find((item) => item.id === categoryId);

      dispatch(editCategory({ categoryId, categoryData: { is_active: category?.is_active === 1 ? 0 : 1 } }))
        .unwrap()
        .then((response) => {
          const { name, is_active } = response;

          const message = is_active
            ? `${name} will be in the transaction creation list`
            : `${name} will no longer be in the transaction creation list`;

          addAlert(message);
        });
    },
    [incomes, expenses, addAlert, dispatch],
  );

  const onCategoryLongPress = useCallback((category: Category) => {
    setLongPressedCategory(category);
    setIsModalVisible(true);
  }, []);

  const onLongPressCancel = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const onMoveForward = useCallback(() => {
    dispatch(sortCategoryForward(longPressedCategory?.id || 0));
    setIsModalVisible(false);
  }, [longPressedCategory, dispatch]);

  const onEdit = useCallback(() => {
    if (longPressedCategory) {
      navigation.navigate(ScreenNames.ADD_CATEGORY_SCREEN, {
        id: longPressedCategory.id,
        name: longPressedCategory.name,
        icon: longPressedCategory.icon,
        color: longPressedCategory.color,
        transaction_type: longPressedCategory.transaction_type,
      });
    }

    onLongPressCancel();
  }, [longPressedCategory, navigation, onLongPressCancel]);

  return {
    isModalVisible,
    incomes: incomes || [],
    expenses: expenses || [],
    longPressedCategory,
    onEdit,
    onUpdate,
    onMoveForward,
    onCategoryLongPress,
    onLongPressCancel,
  };
};

export default useAllCategories;
