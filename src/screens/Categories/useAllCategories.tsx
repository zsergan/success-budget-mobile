import { useState, useCallback } from 'react';

import type { CategoryModel } from '@api/models';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCategory } from '@redux/state/category/selectors';
import { editCategory, sortCategoryForward } from '@redux/state/category/thunks';
import type { ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { useAlert } from '@hooks';
import { getErrorMessage } from '@shared/utils';

interface UseAllCategoriesProps extends ScreenProps<ScreenNames.CATEGORIES_SCREEN> {}

const useAllCategories = ({ navigation }: UseAllCategoriesProps) => {
  const [longPressedCategory, setLongPressedCategory] = useState<CategoryModel | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const dispatch = useAppDispatch();
  const { incomes, expenses } = useAppSelector(selectCategory);
  const { addAlert } = useAlert();

  const onUpdate = useCallback(
    (categoryId: number) => {
      const category = [...incomes, ...expenses].find((item) => item.id === categoryId);

      dispatch(editCategory({ categoryId, categoryData: { is_active: category?.isActive ? 0 : 1 } }))
        .unwrap()
        .then((response) => {
          const { name, isActive } = response;

          const message = isActive
            ? `${name} will be in the transaction creation list`
            : `${name} will no longer be in the transaction creation list`;

          addAlert(message);
        })
        .catch((error) => addAlert(getErrorMessage(error)));
    },
    [incomes, expenses, addAlert, dispatch],
  );

  const onCategoryLongPress = useCallback((category: CategoryModel) => {
    setLongPressedCategory(category);
    setIsModalVisible(true);
  }, []);

  const onLongPressCancel = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const onMoveForward = useCallback(() => {
    dispatch(sortCategoryForward(longPressedCategory?.id || 0))
      .unwrap()
      .catch((error) => addAlert(getErrorMessage(error)));

    setIsModalVisible(false);
  }, [longPressedCategory, dispatch, addAlert]);

  const onEdit = useCallback(() => {
    if (longPressedCategory) {
      navigation.navigate(ScreenNames.ADD_CATEGORY_SCREEN, {
        id: longPressedCategory.id,
        name: longPressedCategory.name,
        icon: longPressedCategory.icon,
        color: longPressedCategory.color,
        transactionType: longPressedCategory.transactionType,
      });
    }

    onLongPressCancel();
  }, [longPressedCategory, navigation, onLongPressCancel]);

  return {
    isModalVisible,
    incomes,
    expenses,
    longPressedCategory,
    onEdit,
    onUpdate,
    onMoveForward,
    onCategoryLongPress,
    onLongPressCancel,
  };
};

export default useAllCategories;
