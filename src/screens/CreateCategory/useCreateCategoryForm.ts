import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { addCategory, editCategory } from '@redux/state/category/thunks';
import { useAppDispatch } from '@redux/hooks';
import type { ScreenNames } from '@shared/enums';
import { TransactionType } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { useFormSubmitHandler } from '@hooks';
import { palette } from '@shared/theme';

interface CreateCategoryFormData {
  name: string;
  transactionType: TransactionType;
  icon: string;
  color: string;
}

const schema = yup.object().shape({
  name: yup.string().required(),
  transactionType: yup.mixed<TransactionType>().oneOf(Object.values(TransactionType)).required(),
  icon: yup.string().required(),
  color: yup.string().required(),
});

interface UseCreateCategoryFormProps extends ScreenProps<ScreenNames.ADD_CATEGORY_SCREEN> {}

const useCreateCategoryForm = ({ navigation, route }: UseCreateCategoryFormProps) => {
  const isNewCategory = route.params.id === 'new';

  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitSuccessful },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: isNewCategory ? '' : route.params.name,
      transactionType: isNewCategory ? TransactionType.EXPENSE : route.params.transactionType,
      icon: isNewCategory ? 'paid' : route.params.icon,
      color: isNewCategory ? palette.black : route.params.color,
    },
  });

  const { onSubmit } = useFormSubmitHandler<CreateCategoryFormData>({
    handleSubmit,
    onSubmit: (formData) => {
      const payload = {
        name: formData.name,
        transaction_type: formData.transactionType,
        icon: formData.icon,
        color: formData.color,
      };

      return isNewCategory
        ? dispatch(addCategory(payload)).unwrap()
        : dispatch(editCategory({ categoryId: route.params.id, categoryData: payload })).unwrap();
    },
    onSuccess: () => navigation.goBack(),
    getInvalidMessage: (errors) => [errors.name && 'Enter a category name'].filter(Boolean).join('\n'),
  });

  return {
    isNewCategory,
    control,
    onSubmit,
    watch,
    isSubmitSuccessful,
  };
};

export default useCreateCategoryForm;
