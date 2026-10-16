import { useEffect, useState } from 'react';
import * as yup from 'yup';
import { useForm, useWatch } from 'react-hook-form';
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
import useLatestRequest from '@screens/Auth/passwordReset/useLatestRequest';
import useSecondsUntil from '@screens/Auth/passwordReset/useSecondsUntil';
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
  const { start, isLatest, abort } = useLatestRequest();
  const [failure, setFailure] = useState<PasswordResetFailure | null>(null);
  const waitSeconds = useSecondsUntil(failure?.kind === 'rateLimited' ? failure.retryAt : null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: initialEmail ?? '' },
  });

  const email = useWatch({ control, name: 'email' });

  // Another address has no code, cooldown or refusal of its own yet, and an answer for the old one is moot.
  const editEmail = (next: string) => {
    abort();
    setFailure(null);
    dispatch(passwordResetEmailEdited(next));
  };

  // This screen opens the flow, so leaving it, back to Sign In or by finishing, ends it.
  useEffect(() => () => void dispatch(passwordResetEnded()), [dispatch]);

  const hasPendingCode = (address: string) => {
    const { email: sentTo, challenge } = store.getState().passwordReset;

    return isSameEmail(sentTo, address) && challenge?.end === null;
  };

  const sendCode = async ({ email: address }: FormData) => {
    const { resendAvailableAt } = store.getState().passwordReset;

    // Back from the code screen with the same address: its code is still on the way, and so is its cooldown.
    if (hasPendingCode(address) && resendAvailableAt !== null && Date.now() < resendAvailableAt) {
      navigation.navigate(ScreenNames.RESET_CODE_SCREEN);
      return;
    }

    setFailure(null);
    const request = start(
      dispatch(passwordResetApi.endpoints.requestPasswordReset.initiate({ email: address }, { track: false })),
    );
    const result = await request;

    if (!isLatest(request)) return;

    if (!result.error) {
      navigation.navigate(ScreenNames.RESET_CODE_SCREEN);
      return;
    }

    const next = getPasswordResetFailure(result.error);

    // Refused only because a code for this address went out moments ago: that code still works.
    if (next?.kind === 'rateLimited' && hasPendingCode(address)) {
      navigation.navigate(ScreenNames.RESET_CODE_SCREEN);
      return;
    }

    setFailure(next);
  };

  const onSubmit = useSingleSubmit(sendCode);
  const isEmailComplete = emailSchema.isValidSync(email);

  return {
    control,
    editEmail,
    onSubmit: handleSubmit(onSubmit),
    isSubmitting,
    isSubmitDisabled: !isEmailComplete || waitSeconds > 0,
    // Only once something is typed: an empty field needs no explaining.
    emailHint: email.trim() !== '' && !isEmailComplete ? 'Enter the full address, like you@example.com.' : undefined,
    failure,
  };
};

export default useForgotPasswordForm;
