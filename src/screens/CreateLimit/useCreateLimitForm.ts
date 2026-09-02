import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { addLimit, editLimit } from '@redux/state/limit/thunks';
import { useAppDispatch } from '@redux/hooks';
import type { ScreenNames } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { useFormSubmitHandler } from '@hooks';
import { ALL_OTHERS_CATEGORIES_ID } from '@shared/constants';
import { amountSchema } from '@shared/utils';

interface CreateLimitFormData {
  category_id?: number;
  amount: string;
}

const schema = yup.object().shape({
  category_id: yup.number(),
  amount: amountSchema,
});

interface UseCreateLimitFormProps extends ScreenProps<ScreenNames.ADD_LIMIT_SCREEN> {}

const useCreateLimitForm = ({ navigation, route }: UseCreateLimitFormProps) => {
  const isNewLimit = route.params.id === 'new';

  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitSuccessful },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      category_id: isNewLimit ? undefined : route.params.category_id,
      amount: isNewLimit ? '' : route.params.amount,
    },
  });

  const { onSubmit } = useFormSubmitHandler<CreateLimitFormData>({
    handleSubmit,
    onSubmit: (formData) => {
      const payload = {
        category_id: formData.category_id === ALL_OTHERS_CATEGORIES_ID ? undefined : formData.category_id,
        amount: formData.amount,
      };

      return isNewLimit
        ? dispatch(addLimit(payload)).unwrap()
        : dispatch(editLimit({ limitId: route.params.id, limitData: payload })).unwrap();
    },
    onSuccess: () => navigation.goBack(),
    getInvalidMessage: (errors) =>
      [errors.amount && 'Enter an amount', errors.category_id && 'Select a category'].filter(Boolean).join('\n'),
  });

  return {
    isNewLimit,
    prevLimit: isNewLimit ? undefined : route.params,
    control,
    onSubmit,
    watch,
    isSubmitSuccessful,
  };
};

export default useCreateLimitForm;
