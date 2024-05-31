import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch } from '@redux/hooks';
import { loginMe } from '@redux/state/auth/thunks';

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required().min(6),
});

interface FormData {
  email: string;
  password: string;
}

const useSignInForm = () => {
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (formData: FormData) => dispatch(loginMe({ email: formData.email, password: formData.password }));

  return {
    control,
    onSubmit: handleSubmit(onSubmit),
    isSubmitting,
  };
};

export default useSignInForm;
