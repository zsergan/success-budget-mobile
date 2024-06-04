import * as yup from 'yup';
import type { FieldError } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { addCategory, editCategory } from '@redux/state/category/thunks';
import { useAppDispatch } from '@redux/hooks';
import type { ScreenNames } from '@shared/enums';
import { TransactionType } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { useAlert } from '@hooks';
import { palette } from '@shared/theme';

interface CreateCategoryFormData {
  name: string;
  transactionType: TransactionType;
  icon: string;
  color: string;
}

type ValidationError = {
  [K in keyof CreateCategoryFormData]?: FieldError;
};

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
  const { addAlert } = useAlert();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitSuccessful },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: isNewCategory ? '' : route.params.name,
      transactionType: isNewCategory ? TransactionType.EXPENSE : route.params.transaction_type,
      icon: isNewCategory ? 'paid' : route.params.icon,
      color: isNewCategory ? palette.black : route.params.color,
    },
  });

  const onSubmit = (formData: CreateCategoryFormData) => {
    const payload = {
      name: formData.name,
      transaction_type: formData.transactionType,
      icon: formData.icon,
      color: formData.color,
    };

    const endPointCall = () =>
      isNewCategory
        ? dispatch(addCategory(payload))
        : dispatch(editCategory({ categoryId: route.params.id, categoryData: payload }));

    endPointCall().then(() => navigation.goBack());
  };

  const onInvalid = (errors: ValidationError) => {
    const errorMessage = [errors.name && 'Enter a category name'].filter(Boolean).join('\n');

    addAlert(errorMessage);
  };

  return {
    isNewCategory,
    control,
    onSubmit: handleSubmit(onSubmit, onInvalid),
    watch,
    isSubmitSuccessful,
  };
};

export default useCreateCategoryForm;
