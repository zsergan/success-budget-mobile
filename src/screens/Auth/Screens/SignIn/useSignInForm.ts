import { useEffect, useRef, useState } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch } from '@redux/hooks';
import { loginMe } from '@redux/state/auth/thunks';
import emailSchema from '@screens/Auth/validation/emailSchema';
import { useSingleSubmit } from '@hooks';
import type { PasswordResetOutcome } from '@shared/types';
import type { SignInFailure, SignInField } from './signInFailure';
import { getFailureFields, getSignInFailure } from './signInFailure';

// Sign-up's stronger password rule is not checked here: accounts made under the older min(6) must still sign in.
const schema = yup.object().shape({
  email: emailSchema,
  password: yup.string().required('Enter your password.').min(6, 'A password is at least 6 characters.'),
});

interface FormData {
  email: string;
  password: string;
}

const useSignInForm = (passwordReset?: PasswordResetOutcome) => {
  const dispatch = useAppDispatch();
  const [failure, setFailure] = useState<SignInFailure | null>(null);
  const editedSinceSubmit = useRef(new Set<SignInField>());

  const {
    control,
    handleSubmit,
    watch,
    setFocus,
    getValues,
    setValue,
    formState: { isSubmitting, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const subscription = watch((_, { name }) => {
      if (!name) return;

      editedSinceSubmit.current.add(name);
      setFailure((current) => (current && getFailureFields(current).includes(name) ? null : current));
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  // Back from recovery: the address it reset, with the old password gone.
  useEffect(() => {
    if (!passwordReset) return;

    setFailure(null);
    setValue('email', passwordReset.email, { shouldValidate: true });
    setValue('password', '');
    setFocus('password');
  }, [passwordReset, setValue, setFocus]);

  // Recovery starts from the address typed here, but only a complete one.
  const getRecoveryEmail = () => {
    const email = getValues('email').trim();

    return emailSchema.isValidSync(email) ? email : undefined;
  };

  const login = async ({ email, password }: FormData) => {
    editedSinceSubmit.current.clear();
    const result = await dispatch(loginMe({ email, password }));

    if (loginMe.rejected.match(result)) {
      const next = getSignInFailure(result.payload);
      const isOutdated = next && getFailureFields(next).some((field) => editedSinceSubmit.current.has(field));

      setFailure(isOutdated ? null : next);
    }
  };

  const onSubmit = useSingleSubmit(login);

  return {
    control,
    onSubmit: handleSubmit(onSubmit),
    isSubmitting,
    isSubmitDisabled: !isValid,
    failure,
    focusField: setFocus,
    getRecoveryEmail,
  };
};

export default useSignInForm;
