import { useEffect } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCurrency } from '@redux/state/currency/selectors';
import { fetchCurrencies } from '@redux/state/currency/thunks';
import { addSpace } from '@redux/state/space/thunks';
import type { ScreenNames } from '@shared/enums';
import { SpaceType } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { useFormSubmitHandler } from '@hooks';

interface CreateSpaceFormData {
  type: SpaceType;
  name: string;
  currency: number;
  invites: string[];
}

const schema = yup.object().shape({
  type: yup.mixed<SpaceType>().oneOf(Object.values(SpaceType)).required(),
  name: yup.string().required(),
  currency: yup.number().required(),
  invites: yup.array().of(yup.string().required()).required(),
});

type UseCreateSpaceFormProps = Pick<ScreenProps<ScreenNames.CREATE_SPACE_SCREEN>, 'navigation'>;

const useCreateSpaceForm = ({ navigation }: UseCreateSpaceFormProps) => {
  const { currencies } = useAppSelector(selectCurrency);
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      type: SpaceType.GROUP,
      name: '',
      currency: undefined,
      invites: [] as string[],
    },
  });

  useEffect(() => {
    dispatch(fetchCurrencies());
  }, [dispatch]);

  const { onSubmit, isSubmitDisabled } = useFormSubmitHandler<CreateSpaceFormData>({
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
    onSubmit: (formData) =>
      dispatch(
        addSpace({
          name: formData.name,
          currency_id: Number(formData.currency),
          type: formData.type,
          invites: formData.type === SpaceType.GROUP && formData.invites.length > 0 ? formData.invites : undefined,
        }),
      ).unwrap(),
    onSuccess: () => navigation.goBack(),
    getInvalidMessage: (errors) =>
      [errors.name && 'Enter a space name', errors.currency && 'Choose a currency'].filter(Boolean).join('\n'),
  });

  return {
    currencies: currencies.map((c) => ({ label: c.code, value: c.id })),
    control,
    watch,
    onSubmit,
    isSubmitDisabled,
  };
};

export default useCreateSpaceForm;
