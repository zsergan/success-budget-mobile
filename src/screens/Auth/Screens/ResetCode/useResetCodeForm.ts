import { useEffect, useState } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useSingleSubmit } from '@hooks';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { passwordResetApi } from '@redux/state/passwordReset/api';
import { selectPasswordReset } from '@redux/state/passwordReset/selectors';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import type { PasswordResetFailure } from '@screens/Auth/passwordReset/passwordResetFailure';
import { getPasswordResetFailure } from '@screens/Auth/passwordReset/passwordResetFailure';
import useAbortOnLeave from '@screens/Auth/passwordReset/useAbortOnLeave';
import useSecondsUntil from '@screens/Auth/passwordReset/useSecondsUntil';

const CODE_LENGTH = 6;

const schema = yup.object().shape({
  code: yup
    .string()
    .required('Enter the 6-digit code.')
    .matches(/^\d{6}$/, 'Enter the 6-digit code.'),
});

interface FormData {
  code: string;
}

// Paste and the iOS code suggestion may bring spaces or dashes; only the digits count.
export const toCode = (text: string) => text.replace(/\D/g, '').slice(0, CODE_LENGTH);

type UseResetCodeFormProps = Pick<RootStackScreenProps<ScreenNames.RESET_CODE_SCREEN>, 'navigation' | 'route'>;

const useResetCodeForm = ({ navigation, route }: UseResetCodeFormProps) => {
  const dispatch = useAppDispatch();
  const abortOnLeave = useAbortOnLeave();
  const { email, resendAvailableAt } = useAppSelector(selectPasswordReset);
  const resendSeconds = useSecondsUntil(resendAvailableAt);
  const [failure, setFailure] = useState<PasswordResetFailure | null>(null);
  const [isResending, setIsResending] = useState(false);
  // Only a code the server accepted for this address opens this screen.
  const [hasChallenge] = useState(email !== null);

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { isSubmitting, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (!hasChallenge) navigation.popTo(ScreenNames.FORGOT_PASSWORD_SCREEN);
  }, [hasChallenge, navigation]);

  // Sent back from the password screen: the authorization ran out, so only a new code helps.
  const hasExpiredNotice = route.params?.notice === 'authorizationExpired';
  const shownFailure: PasswordResetFailure | null =
    failure ?? (hasExpiredNotice ? { kind: 'authorizationInvalid' } : null);

  const clearNotice = () => {
    if (hasExpiredNotice) navigation.setParams({ notice: undefined });
  };

  const changeCode = (text: string) => {
    setValue('code', toCode(text), { shouldValidate: true });
    // A wrong or replaced code is fixed by typing; an unusable one only by a new code.
    setFailure((current) =>
      current?.kind === 'codeUnusable' || current?.kind === 'authorizationInvalid' ? current : null,
    );
  };

  const verify = async ({ code }: FormData) => {
    if (email === null) return;

    setFailure(null);
    clearNotice();
    const result = await abortOnLeave(
      dispatch(passwordResetApi.endpoints.verifyPasswordReset.initiate({ email, code }, { track: false })),
    );

    if (!result.error) {
      setValue('code', '');
      navigation.navigate(ScreenNames.NEW_PASSWORD_SCREEN);
      return;
    }

    const next = getPasswordResetFailure(result.error);

    if (next?.kind === 'codeInvalid') {
      setError('code', { message: 'That code doesn’t match. Check the latest email.' });
    } else {
      setFailure(next);
    }
  };

  const resend = async () => {
    if (email === null || isResending || resendSeconds > 0) return;

    setIsResending(true);
    const result = await abortOnLeave(
      dispatch(passwordResetApi.endpoints.requestPasswordReset.initiate({ email }, { track: false })),
    );

    setIsResending(false);

    if (result.error) {
      setFailure(getPasswordResetFailure(result.error));
    } else {
      setFailure(null);
      clearNotice();
      setValue('code', '', { shouldValidate: false });
    }
  };

  const onSubmit = useSingleSubmit(verify);
  const isCodeUsable = shownFailure?.kind !== 'codeUnusable' && shownFailure?.kind !== 'authorizationInvalid';

  return {
    hasChallenge,
    email,
    control,
    changeCode,
    onSubmit: handleSubmit(onSubmit),
    isSubmitting,
    isSubmitDisabled: !isValid || !isCodeUsable || isResending,
    resend,
    isResending,
    resendSeconds,
    isResendDisabled: resendSeconds > 0 || isSubmitting || isResending,
    failure: shownFailure,
  };
};

export default useResetCodeForm;
