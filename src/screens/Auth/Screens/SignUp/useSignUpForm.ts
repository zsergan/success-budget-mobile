import { useEffect } from 'react';
import * as yup from 'yup';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { registerMe } from '@redux/state/auth/thunks';
import type { RootStackScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { selectAuth } from '@redux/state/auth/selectors';
import emailSchema from '@screens/Auth/Screens/emailSchema';
import useSingleSubmit from '@screens/Auth/Screens/useSingleSubmit';

const PASSWORD_MIN_LENGTH = 8;

const countCharacters = (count: number) => `${count} ${count === 1 ? 'character' : 'characters'}`;

const schema = yup.object().shape({
  name: yup.string().trim().required('Enter your name.'),
  email: emailSchema,
  password: yup
    .string()
    .required('Enter a password.')
    .min(
      PASSWORD_MIN_LENGTH,
      ({ value }: { value: string }) =>
        `Too short: ${countCharacters(value.length)} of the ${PASSWORD_MIN_LENGTH} required.`,
    )
    .matches(/[a-zA-Z]/, 'Add at least one letter.')
    .matches(/\d/, 'Add at least one digit.'),
  passwordConfirm: yup
    .string()
    .required('Repeat the password.')
    .oneOf([yup.ref('password')], 'Passwords don’t match.'),
  currency: yup.number().required('Pick a currency.'),
});

interface FormData {
  name: string;
  currency: number;
  email: string;
  password: string;
  passwordConfirm: string;
}

type UseSignUpFormProps = Pick<RootStackScreenProps<ScreenNames.SIGN_UP_SCREEN>, 'navigation'>;

const useSignUpForm = ({ navigation }: UseSignUpFormProps) => {
  const { userEmail } = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    getFieldState,
    trigger,
    setFocus,
    formState: { isSubmitting, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      currency: undefined,
      email: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const [email, password] = useWatch({ control, name: ['email', 'password'] });

  // A confirmation already filled in is checked again against every change to the password itself.
  useEffect(() => {
    if (getFieldState('passwordConfirm').isTouched) {
      trigger('passwordConfirm');
    }
  }, [password, getFieldState, trigger]);

  useEffect(() => {
    if (userEmail) {
      navigation.navigate(ScreenNames.VERIFY_EMAIL_SCREEN);
    }
  }, [navigation, userEmail]);

  const register = (formData: FormData) =>
    dispatch(
      registerMe({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        base_currency_id: formData.currency,
      }),
    );

  const onSubmit = useSingleSubmit(register);

  return {
    control,
    onSubmit: handleSubmit(onSubmit),
    isSubmitting,
    isSubmitDisabled: !isValid,
    // Only the address's format: whether it is free or real is for the server to say.
    isEmailWellFormed: emailSchema.isValidSync(email),
    focusField: setFocus,
  };
};

export default useSignUpForm;
