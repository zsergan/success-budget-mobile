import { useEffect } from 'react';
import * as yup from 'yup';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAlert, useSingleSubmit } from '@hooks';
import { useAppDispatch } from '@redux/hooks';
import { registerMe } from '@redux/state/auth/thunks';
import type { RootStackScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { getErrorMessage } from '@shared/utils';
import emailSchema from '@screens/Auth/validation/emailSchema';

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
    // Not oneOf: yup checks that before required, so an empty confirmation would read as a mismatch.
    .test('matches-password', 'Passwords don’t match.', (value, { parent }) => !value || value === parent.password),
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
  const dispatch = useAppDispatch();
  const { addAlert } = useAlert();

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

  const register = async (formData: FormData) => {
    const result = await dispatch(
      registerMe({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        base_currency_id: formData.currency,
      }),
    );

    // A registration that ends after the user left neither pulls them back nor alerts its failure.
    if (!navigation.isFocused()) return;

    if (registerMe.fulfilled.match(result)) {
      navigation.navigate(ScreenNames.VERIFY_EMAIL_SCREEN);
    } else {
      addAlert(getErrorMessage(result.payload));
    }
  };

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
