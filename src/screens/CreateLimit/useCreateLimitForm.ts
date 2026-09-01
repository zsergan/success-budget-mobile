import * as yup from 'yup';
import type { FieldError } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { addLimit, editLimit } from '@redux/state/limit/thunks';
import { useAppDispatch } from '@redux/hooks';
import type { ScreenNames } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { useAlert } from '@hooks';
import { ALL_OTHERS_CATEGORIES_ID } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

interface CreateLimitFormData {
  category_id?: number;
  amount: string;
}

type ValidationError = {
  [K in keyof CreateLimitFormData]?: FieldError;
};

const schema = yup.object().shape({
  category_id: yup.number(),
  amount: yup.string().required(),
});

interface UseCreateLimitFormProps extends ScreenProps<ScreenNames.ADD_LIMIT_SCREEN> {}

const useCreateLimitForm = ({ navigation, route }: UseCreateLimitFormProps) => {
  const isNewLimit = route.params.id === 'new';

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
      category_id: isNewLimit ? undefined : route.params.category_id,
      amount: isNewLimit ? '' : route.params.amount,
    },
  });

  const onSubmit = async (formData: CreateLimitFormData) => {
    const payload = {
      category_id: formData.category_id === ALL_OTHERS_CATEGORIES_ID ? undefined : formData.category_id,
      amount: formData.amount,
    };

    const endPointCall = () =>
      isNewLimit ? dispatch(addLimit(payload)) : dispatch(editLimit({ limitId: route.params.id, limitData: payload }));

    try {
      await endPointCall().unwrap();
      navigation.goBack();
    } catch (error) {
      addAlert(getErrorMessage(error));
      throw error;
    }
  };

  const onInvalid = (errors: ValidationError) => {
    const errorMessage = [errors.amount && 'Enter an amount', errors.category_id && 'Select a category']
      .filter(Boolean)
      .join('\n');

    addAlert(errorMessage);
  };

  const submitForm = handleSubmit(onSubmit, onInvalid);

  return {
    isNewLimit,
    prevLimit: isNewLimit ? undefined : route.params,
    control,
    onSubmit: () => submitForm().catch(() => undefined),
    watch,
    isSubmitSuccessful,
  };
};

export default useCreateLimitForm;
