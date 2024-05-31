import { useEffect } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { registerMe } from '@redux/state/auth/thunks';
import { selectCurrency } from '@redux/state/currency/selectors';
import { fetchCurrencies } from '@redux/state/currency/thunks';
import type { ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { selectAuth } from '@redux/state/auth/selectors';

const schema = yup.object().shape({
  name: yup.string().required(),
  currency: yup.number().required(),
  email: yup.string().email().required(),
  password: yup.string().required().min(6),
  passwordConfirm: yup.string().required().min(6),
});

interface FormData {
  name: string;
  currency: number;
  email: string;
  password: string;
  passwordConfirm: string;
}

type UseSignInFormProps = Pick<ScreenProps<ScreenNames.SIGN_UP_SCREEN>, 'navigation'>;

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
    dispatch(
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
