import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useToast } from '@hooks';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { verifyEmailMe } from '@redux/state/auth/thunks';
import { selectAuth } from '@redux/state/auth/selectors';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import { getErrorMessage, isApiError } from '@shared/utils';

const schema = yup.object().shape({
  code: yup
    .string()
    .required()
    .matches(/^\d{6}$/, 'Enter the 6-digit code'),
});

interface FormData {
  code: string;
}

type UseVerifyEmailFormProps = Pick<RootStackScreenProps<ScreenNames.VERIFY_EMAIL_SCREEN>, 'navigation'>;

const useVerifyEmailForm = ({ navigation }: UseVerifyEmailFormProps) => {
  const { userEmail } = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const toast = useToast();

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { code: '' },
  });

  // A success signs in and the app takes over. An already verified account goes to Sign In, which says so once; any
  // other failure stays under the code. An answer after the user left changes nothing.
  const onSubmit = async (formData: FormData) => {
    const ticket = toast.begin();
    const result = await dispatch(verifyEmailMe({ email: userEmail || '', code: formData.code }));

    if (!verifyEmailMe.rejected.match(result) || !navigation.isFocused()) return;

    if (isApiError(result.payload, 409)) {
      ticket.showAfterNavigation({ tone: 'info', text: 'This email is already verified. Sign in to continue.' });
      navigation.navigate(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true });
    } else {
      setError('code', { type: 'server', message: getErrorMessage(result.payload) });
    }
  };

  return {
    control,
    onSubmit: handleSubmit(onSubmit),
    isSubmitting,
  };
};

export default useVerifyEmailForm;
