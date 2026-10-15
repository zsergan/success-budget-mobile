import { useEffect, useState } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useSingleSubmit } from '@hooks';
import { useAppDispatch, useAppStore } from '@redux/hooks';
import { passwordResetApi } from '@redux/state/passwordReset/api';
import { isSameEmail } from '@redux/state/passwordReset/selectors';
import { passwordResetEmailEdited, passwordResetEnded } from '@redux/state/passwordReset/slice';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import type { PasswordResetFailure } from '@screens/Auth/passwordReset/passwordResetFailure';
import { getPasswordResetFailure } from '@screens/Auth/passwordReset/passwordResetFailure';
import useAbortOnLeave from '@screens/Auth/passwordReset/useAbortOnLeave';
import emailSchema from '@screens/Auth/validation/emailSchema';

const schema = yup.object().shape({ email: emailSchema });

interface FormData {
  email: string;
}

type UseForgotPasswordFormProps = Pick<RootStackScreenProps<ScreenNames.FORGOT_PASSWORD_SCREEN>, 'navigation'> & {
  initialEmail?: string;
};

const useForgotPasswordForm = ({ navigation, initialEmail }: UseForgotPasswordFormProps) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const abortOnLeave = useAbortOnLeave();
  const [failure, setFailure] = useState<PasswordResetFailure | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: { email: initialEmail ?? '' },
  });

  useEffect(() => {
    const subscription = watch(({ email }) => {
      setFailure(null);
      dispatch(passwordResetEmailEdited(email ?? ''));
    });

    return () => subscription.unsubscribe();
  }, [watch, dispatch]);

  // This screen opens the flow, so leaving it, back to Sign In or by finishing, ends it.
  useEffect(() => () => void dispatch(passwordResetEnded()), [dispatch]);

  const sendCode = async ({ email }: FormData) => {
    const { email: sentTo, resendAvailableAt } = store.getState().passwordReset;

    // Back from the code screen with the same address: its code is still on the way.
    if (isSameEmail(sentTo, email) && resendAvailableAt !== null && Date.now() < resendAvailableAt) {
      navigation.navigate(ScreenNames.RESET_CODE_SCREEN);
      return;
    }

    setFailure(null);
    const result = await abortOnLeave(
      dispatch(passwordResetApi.endpoints.requestPasswordReset.initiate({ email }, { track: false })),
    );

    if (result.error) {
      setFailure(getPasswordResetFailure(result.error));
    } else {
      navigation.navigate(ScreenNames.RESET_CODE_SCREEN);
    }
  };

  const onSubmit = useSingleSubmit(sendCode);

  return {
    control,
    onSubmit: handleSubmit(onSubmit),
    isSubmitting,
    isSubmitDisabled: !isValid,
    failure,
  };
};

export default useForgotPasswordForm;
