import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { verifyEmailMe } from '@redux/state/auth/thunks';
import { selectAuth } from '@redux/state/auth/selectors';

const schema = yup.object().shape({
  code: yup.string().required(),
});

interface FormData {
  code: string;
}

const useVerifyEmailForm = () => {
  const { userEmail } = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { code: '' },
  });

  const onSubmit = (formData: FormData) => {
    dispatch(verifyEmailMe({ email: userEmail || '', code: formData.code }));
  };

  return {
    control,
    onSubmit: handleSubmit(onSubmit),
    isSubmitting,
  };
};

export default useVerifyEmailForm;
