import { useEffect, useRef, useState } from 'react';
import * as yup from 'yup';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useSingleSubmit } from '@hooks';
import { useAppDispatch, useAppSelector, useAppStore } from '@redux/hooks';
import { passwordResetApi } from '@redux/state/passwordReset/api';
import { isAuthorizationUsable, selectPasswordReset } from '@redux/state/passwordReset/selectors';
import { resetAuthorizationDiscarded } from '@redux/state/passwordReset/slice';
import { ScreenNames } from '@shared/enums';
import type { PasswordResetOutcome, RootStackScreenProps } from '@shared/types';
import type { PasswordResetFailure } from '@screens/Auth/passwordReset/passwordResetFailure';
import { getPasswordResetFailure } from '@screens/Auth/passwordReset/passwordResetFailure';
import useLatestRequest from '@screens/Auth/passwordReset/useLatestRequest';

const PASSWORD_MIN_LENGTH = 8;
// bcrypt ignores every byte past the 72nd, so the backend refuses longer passwords.
const PASSWORD_MAX_BYTES = 72;

export const utf8Length = (text: string) => {
  let bytes = 0;

  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 0;

    bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4;
  }

  return bytes;
};

// The backend's rule for a new password; Sign In keeps its older, looser check for existing accounts.
export const getPasswordRules = (password: string) => ({
  length: password.length >= PASSWORD_MIN_LENGTH,
  letter: /[A-Za-z]/.test(password),
  digit: /\d/.test(password),
});

export const isStrongPassword = (password: string) => {
  const rules = getPasswordRules(password);

  return rules.length && rules.letter && rules.digit;
};

const schema = yup.object().shape({
  password: yup
    .string()
    .required('Enter a new password.')
    .test('strong', 'Too weak. Add what’s missing below.', (value) => isStrongPassword(value ?? ''))
    .test('max-bytes', 'Too long. Use a shorter password.', (value) => utf8Length(value ?? '') <= PASSWORD_MAX_BYTES),
  passwordConfirm: yup
    .string()
    .required('Repeat the new password.')
    // Only against a password that passes: a weak one is the thing to fix first.
    .test(
      'matches-password',
      'Passwords don’t match.',
      (value, { parent }) => !isStrongPassword(parent.password) || value === parent.password,
    ),
});

interface FormData {
  password: string;
  passwordConfirm: string;
}

type UseNewPasswordFormProps = Pick<RootStackScreenProps<ScreenNames.NEW_PASSWORD_SCREEN>, 'navigation'>;

const useNewPasswordForm = ({ navigation }: UseNewPasswordFormProps) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const { start, isLatest } = useLatestRequest();
  const { email, authorization } = useAppSelector(selectPasswordReset);
  const [failure, setFailure] = useState<PasswordResetFailure | null>(null);
  // Only a code the server just confirmed opens this screen.
  const [isAuthorized] = useState(() => isAuthorizationUsable(authorization));
  // A save whose answer was lost may have changed the password, so a later refusal can't tell it failed.
  const mayHaveSavedRef = useRef(false);
  const [mayHaveSaved, setMayHaveSaved] = useState(false);

  const {
    control,
    handleSubmit,
    setFocus,
    formState: { isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    // Missing values are reported on Save, which is always on; after that every change rechecks them.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { password: '', passwordConfirm: '' },
  });

  const [password, passwordConfirm] = useWatch({ control, name: ['password', 'passwordConfirm'] });
  const isStrong = isStrongPassword(password);

  useEffect(() => {
    if (!isAuthorized) navigation.popTo(ScreenNames.RESET_CODE_SCREEN);
  }, [isAuthorized, navigation]);

  // Going back means confirming the code again; the authorization never outlives this screen.
  useEffect(() => () => void dispatch(resetAuthorizationDiscarded()), [dispatch]);

  const finish = (outcome: PasswordResetOutcome['outcome']) => {
    navigation.popTo(ScreenNames.SIGN_IN_SCREEN, { passwordReset: { email: email ?? '', outcome } });
  };

  const onAuthorizationInvalid = () => {
    if (mayHaveSavedRef.current) {
      finish('unknown');
    } else {
      navigation.popTo(ScreenNames.RESET_CODE_SCREEN, { notice: 'authorizationExpired' });
    }
  };

  const save = async ({ password }: FormData) => {
    const current = store.getState().passwordReset.authorization;

    if (current === null || !isAuthorizationUsable(current)) {
      onAuthorizationInvalid();
      return;
    }

    setFailure(null);
    const request = start(
      dispatch(
        passwordResetApi.endpoints.completePasswordReset.initiate(
          { reset_token: current.token, password },
          { track: false },
        ),
      ),
    );
    const result = await request;

    if (!isLatest(request)) return;

    if (!result.error) {
      finish('updated');
      return;
    }

    const next = getPasswordResetFailure(result.error);

    if (next?.kind === 'authorizationInvalid') {
      onAuthorizationInvalid();
      return;
    }

    if (next?.kind === 'connection') {
      mayHaveSavedRef.current = true;
      setMayHaveSaved(true);
    }

    setFailure(next);
  };

  const onSubmit = useSingleSubmit(save);

  return {
    isAuthorized,
    email,
    control,
    onSubmit: handleSubmit(onSubmit),
    isSubmitting,
    failure,
    mayHaveSaved,
    // The answer to the lost save never came: the new password may already work.
    signInInstead: () => finish('unknown'),
    passwordRules: getPasswordRules(password),
    isPasswordValid: isStrong && utf8Length(password) <= PASSWORD_MAX_BYTES,
    isConfirmValid: isStrong && passwordConfirm === password,
    focusField: setFocus,
  };
};

export default useNewPasswordForm;
