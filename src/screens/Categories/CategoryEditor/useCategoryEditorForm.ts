import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useBottomSheet } from '@gorhom/bottom-sheet';

import type { CreateCategoryRequest, UpdateCategoryRequest } from '@api/dto';
import type { CategoryModel } from '@api/models';
import { toBackendIcon } from '@api/models';
import { useAppDispatch } from '@redux/hooks';
import { addCategory, editCategory } from '@redux/state/category/thunks';
import { AppColor, TransactionType } from '@shared/enums';
import type { IconType } from '@shared/types';
import { CATEGORY_ICON_LIST } from '@shared/icons';
import { useFormSubmitHandler } from '@hooks';

export const NAME_MAX_LENGTH = 24;

interface CategoryEditorFormData {
  name: string;
  transactionType: TransactionType;
  icon: IconType;
  color: AppColor;
}

const schema = yup.object().shape({
  name: yup.string().trim().required().max(NAME_MAX_LENGTH),
  transactionType: yup.mixed<TransactionType>().oneOf(Object.values(TransactionType)).required(),
  icon: yup.mixed<IconType>().oneOf(CATEGORY_ICON_LIST).required(),
  color: yup.mixed<AppColor>().oneOf(Object.values(AppColor)).required(),
});

interface UseCategoryEditorFormProps {
  category?: CategoryModel;
  defaultTransactionType?: TransactionType;
}

const useCategoryEditorForm = ({ category, defaultTransactionType }: UseCategoryEditorFormProps) => {
  const isNewCategory = !category;
  const dispatch = useAppDispatch();
  const { close } = useBottomSheet();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      transactionType: category?.transactionType ?? defaultTransactionType ?? TransactionType.EXPENSE,
      icon: category?.icon ?? 'other',
      color: category?.color ?? AppColor.SLATE,
    },
  });

  const { onSubmit, isSubmitDisabled } = useFormSubmitHandler<CategoryEditorFormData>({
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
    onSubmit: (formData) => {
      if (isNewCategory) {
        const payload: CreateCategoryRequest = {
          name: formData.name.trim(),
          transaction_type: formData.transactionType,
          icon: toBackendIcon(formData.icon),
          color: formData.color,
        };

        return dispatch(addCategory(payload)).unwrap();
      }

      const payload: UpdateCategoryRequest = {
        name: formData.name.trim(),
        icon: toBackendIcon(formData.icon),
        color: formData.color,
      };

      return dispatch(editCategory({ categoryId: category.id, categoryData: payload })).unwrap();
    },
    onSuccess: () => close(),
    getInvalidMessage: (errors) => [errors.name && 'Enter a category name'].filter(Boolean).join('\n'),
  });

  return {
    isNewCategory,
    control,
    watch,
    onSubmit,
    isSubmitDisabled,
  };
};

export default useCategoryEditorForm;
