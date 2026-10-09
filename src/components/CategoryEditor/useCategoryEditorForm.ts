import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useBottomSheet } from '@gorhom/bottom-sheet';

import type { CreateCategoryRequest, UpdateCategoryRequest } from '@api/dto';
import type { CategoryModel } from '@api/models';
import { toBackendIcon } from '@api/models';
import { requireSpaceId } from '@redux/api/baseApi';
import { useAppSelector } from '@redux/hooks';
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '@redux/state/category/api';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { AppColor, TransactionType } from '@shared/enums';
import type { IconType } from '@shared/types';
import { CATEGORY_ICON_LIST } from '@shared/icons';
import { useFormSubmitHandler } from '@hooks';

export const NAME_MAX_LENGTH = 20;

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
  onSaved?: (category: CategoryModel) => void;
}

const useCategoryEditorForm = ({ category, defaultTransactionType, onSaved }: UseCategoryEditorFormProps) => {
  const isNewCategory = !category;
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const { close } = useBottomSheet();

  const {
    control,
    handleSubmit,
    watch,
    reset,
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

  const { onSubmit, isSubmitDisabled } = useFormSubmitHandler<CategoryEditorFormData, CategoryModel>({
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
    onSubmit: async (formData) => {
      if (isNewCategory) {
        const payload: CreateCategoryRequest = {
          name: formData.name.trim(),
          transaction_type: formData.transactionType,
          icon: toBackendIcon(formData.icon),
          color: formData.color,
        };

        return createCategory({ spaceId: requireSpaceId(spaceId), data: payload }).unwrap();
      }

      const payload: UpdateCategoryRequest = {
        name: formData.name.trim(),
        icon: toBackendIcon(formData.icon),
        color: formData.color,
      };

      return updateCategory({ spaceId: requireSpaceId(spaceId), categoryId: category.id, data: payload }).unwrap();
    },
    onSuccess: (saved) => {
      onSaved?.(saved);
      close();
    },
    getInvalidMessage: (errors) => [errors.name && 'Enter a category name'].filter(Boolean).join('\n'),
    reset,
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
