import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch } from '@redux/hooks';
import { useGetCurrenciesQuery } from '@redux/state/currency/api';
import { createSpaceAndSelect } from '@redux/state/space/thunks';
import type { ScreenNames } from '@shared/enums';
import { SpaceType } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import { useFormSubmitHandler } from '@hooks';

interface CreateSpaceFormData {
  type: SpaceType;
  name: string;
  currency: number;
  invites: string[];
}

const schema = yup.object().shape({
  type: yup.mixed<SpaceType>().oneOf(Object.values(SpaceType)).required(),
  name: yup.string().trim().required('Enter a space name'),
  currency: yup.number().typeError('Choose a currency').required('Choose a currency'),
  invites: yup.array().of(yup.string().required()).required(),
});

type UseCreateSpaceFormProps = Pick<RootStackScreenProps<ScreenNames.CREATE_SPACE_SCREEN>, 'navigation'>;

const useCreateSpaceForm = ({ navigation }: UseCreateSpaceFormProps) => {
  const { currentData: currencies = [] } = useGetCurrenciesQuery();
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

  const { onSubmit, isSubmitDisabled, submitError } = useFormSubmitHandler<CreateSpaceFormData>({
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
    onSubmit: (formData) =>
      dispatch(
        createSpaceAndSelect({
          name: formData.name,
          currency_id: Number(formData.currency),
          type: formData.type,
          invites: formData.type === SpaceType.GROUP && formData.invites.length > 0 ? formData.invites : undefined,
        }),
      ),
    onSuccess: () => navigation.goBack(),
  });

  return {
    currencies: currencies.map((c) => ({ label: c.code, value: c.id })),
    control,
    watch,
    onSubmit,
    isSubmitDisabled,
    submitError,
  };
};

export default useCreateSpaceForm;
