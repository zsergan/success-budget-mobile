import { useEffect } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { registerMe } from '@redux/state/auth/thunks';
import { selectCurrency } from '@redux/state/currency/selectors';
import { fetchCurrencies } from '@redux/state/currency/thunks';
import type { RootStackScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { selectAuth } from '@redux/state/auth/selectors';

const passwordSchema = yup
  .string()
  .required()
  .min(8, 'Password must be at least 8 characters')
  .matches(/[a-zA-Z]/, 'Password must contain a letter')
  .matches(/\d/, 'Password must contain a number');

const schema = yup.object().shape({
  name: yup.string().required(),
  currency: yup.number().required(),
  email: yup.string().email().required(),
  password: passwordSchema,
  passwordConfirm: passwordSchema.oneOf([yup.ref('password')], 'Passwords must match'),
});

interface FormData {
  name: string;
  currency: number;
  email: string;
  password: string;
  passwordConfirm: string;
}

type UseSignInFormProps = Pick<RootStackScreenProps<ScreenNames.SIGN_UP_SCREEN>, 'navigation'>;

const useSignInForm = ({ navigation }: UseSignInFormProps) => {
  const { currencies } = useAppSelector(selectCurrency);
  const { userEmail } = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      currency: undefined,
      email: '',
      password: '',
      passwordConfirm: '',
    },
  });

  useEffect(() => {
    dispatch(fetchCurrencies());
  }, [dispatch]);

  useEffect(() => {
    if (userEmail) {
      navigation.navigate(ScreenNames.VERIFY_EMAIL_SCREEN);
    }
  }, [navigation, userEmail]);

  const onSubmit = (formData: FormData) => {
    return dispatch(
      registerMe({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        base_currency_id: formData.currency,
      }),
    );
  };

  return {
    currencies: currencies.map((c) => ({ label: c.code, value: c.id })),
    control,
    onSubmit: handleSubmit(onSubmit),
    isSubmitting,
  };
};

export default useSignInForm;
