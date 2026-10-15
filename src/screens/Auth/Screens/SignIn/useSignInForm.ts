import { useEffect, useRef, useState } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch } from '@redux/hooks';
import { loginMe } from '@redux/state/auth/thunks';
import type { SignInFailure } from './signInFailure';
import { getSignInFailure } from './signInFailure';

// Sign-up's stronger password rule is not checked here: accounts made under the older min(6) must still sign in.
const schema = yup.object().shape({
  email: yup.string().required('Enter your email.').email('Enter a valid email, like you@example.com.'),
  password: yup.string().required('Enter your password.').min(6, 'A password is at least 6 characters.'),
});

interface FormData {
  email: string;
  password: string;
}

const useSignInForm = () => {
  const dispatch = useAppDispatch();
  // isSubmitting reaches the button only on the next render, so a quick second press joins the request already sent.
  const pendingLogin = useRef<Promise<unknown> | null>(null);
  const [failure, setFailure] = useState<SignInFailure | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Wrong credentials stop being true once either field changes; a lost connection does not.
  useEffect(() => {
    const subscription = watch(() => setFailure((current) => (current?.kind === 'credentials' ? null : current)));

    return () => subscription.unsubscribe();
  }, [watch]);

  const login = async ({ email, password }: FormData) => {
    const result = await dispatch(loginMe({ email, password }));

    if (loginMe.rejected.match(result)) {
      setFailure(getSignInFailure(result.payload));
    }
  };

  const onSubmit = (formData: FormData) => {
    pendingLogin.current ??= login(formData).finally(() => {
      pendingLogin.current = null;
    });

    return pendingLogin.current;
  };

  return {
    control,
    onSubmit: handleSubmit(onSubmit),
    isSubmitting,
    isSubmitDisabled: !isValid,
    failure,
  };
};

export default useSignInForm;
