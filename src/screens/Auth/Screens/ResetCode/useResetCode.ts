import { useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { useToast } from '@hooks';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { passwordResetApi } from '@redux/state/passwordReset/api';
import { selectPasswordReset } from '@redux/state/passwordReset/selectors';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import type { PasswordResetFailure } from '@screens/Auth/passwordReset/passwordResetFailure';
import { getPasswordResetFailure } from '@screens/Auth/passwordReset/passwordResetFailure';
import useLatestRequest from '@screens/Auth/passwordReset/useLatestRequest';
import useSecondsUntil from '@screens/Auth/passwordReset/useSecondsUntil';
import { CODE_LENGTH } from './components/CodeInput/CodeInput';

// Paste and code autofill may bring spaces or dashes; only the digits count, leading zeros included.
const toCode = (text: string) => text.replace(/\D/g, '').slice(0, CODE_LENGTH);

// Why the code on screen can't be used any more; only a new code moves on from here.
export type CodeBlock = 'expired' | 'attempts' | 'unknown' | 'authorizationExpired';

type Action = 'verify' | 'resend';

type UseResetCodeProps = Pick<RootStackScreenProps<ScreenNames.RESET_CODE_SCREEN>, 'navigation' | 'route'>;

const useResetCode = ({ navigation, route }: UseResetCodeProps) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { start, isLatest } = useLatestRequest();
  const { email, resendAvailableAt, challenge } = useAppSelector(selectPasswordReset);
  const inputRef = useRef<TextInput>(null);
  // Taps land before a re-render can disable the buttons; this one request at a time doesn't wait for it.
  const isBusy = useRef(false);

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isPasted, setIsPasted] = useState(false);
  const [running, setRunning] = useState<Action | null>(null);
  const [failure, setFailure] = useState<{ failure: PasswordResetFailure; action: Action } | null>(null);
  const [isJustSent, setIsJustSent] = useState(false);
  // Only a code the server accepted for this address opens this screen.
  const [hasChallenge] = useState(email !== null);

  useEffect(() => {
    if (!hasChallenge) navigation.popTo(ScreenNames.FORGOT_PASSWORD_SCREEN);
  }, [hasChallenge, navigation]);

  const resendSeconds = useSecondsUntil(resendAvailableAt);
  const rateLimit = failure?.action === 'verify' && failure.failure.kind === 'rateLimited' ? failure.failure : null;
  const verifyWaitSeconds = useSecondsUntil(rateLimit?.retryAt);

  const hasExpiredNotice = route.params?.notice === 'authorizationExpired';
  // Only the server's answer blocks the code: a request never says which challenge it started or when it ends.
  const block: CodeBlock | null = hasExpiredNotice
    ? 'authorizationExpired'
    : challenge?.end === 'expired' || challenge?.end === 'attempts' || challenge?.end === 'unknown'
      ? challenge.end
      : null;

  const clearAfterNewCode = () => {
    setCode('');
    setCodeError(null);
    setIsPasted(false);
    setFailure(null);
    if (hasExpiredNotice) navigation.setParams({ notice: undefined });
  };

  const applyCode = (next: string, isPaste: boolean) => {
    if (running || block) return;

    setCode(next);
    setIsPasted(isPaste);
    setCodeError(null);
    setIsJustSent(false);
    // A wait set by the server outlives typing; anything else was about the code that was there before.
    setFailure((current) => (current?.failure.kind === 'rateLimited' ? current : null));
  };

  // More than one digit arriving at once is a paste or an autofill, never typing.
  const changeCode = (text: string) => {
    const next = toCode(text);

    applyCode(next, next.length - code.length > 1);
  };

  const pasteCode = async () => {
    try {
      const pasted = toCode(await Clipboard.getStringAsync());

      if (pasted !== '') applyCode(pasted, true);
    } catch {
      // Nothing readable on the clipboard: the field is still there to type in.
    }

    inputRef.current?.focus();
  };

  const verify = async () => {
    if (isBusy.current || email === null || block || code.length !== CODE_LENGTH || verifyWaitSeconds > 0) return;

    isBusy.current = true;
    setRunning('verify');
    setFailure(null);
    setIsPasted(false);
    setIsJustSent(false);

    const request = start(
      dispatch(passwordResetApi.endpoints.verifyPasswordReset.initiate({ email, code }, { track: false })),
    );
    const result = await request;

    if (!isLatest(request)) return;

    isBusy.current = false;
    setRunning(null);

    if (!result.error) {
      setCode('');
      navigation.navigate(ScreenNames.NEW_PASSWORD_SCREEN);
      return;
    }

    const next = getPasswordResetFailure(result.error);

    if (next?.kind === 'codeInvalid') {
      setCodeError('That code doesn’t match. Check the latest email and try again.');
    } else if (next && next.kind !== 'codeUnusable') {
      // An unusable code is in the slice now, as the block above.
      setFailure({ failure: next, action: 'verify' });
    }
  };

  const resend = async () => {
    if (isBusy.current || email === null || resendSeconds > 0) return;

    isBusy.current = true;
    setRunning('resend');
    setFailure(null);
    const ticket = toast.begin();

    const request = start(
      dispatch(passwordResetApi.endpoints.requestPasswordReset.initiate({ email }, { track: false })),
    );
    const result = await request;

    if (!isLatest(request)) return;

    isBusy.current = false;
    setRunning(null);

    if (result.error) {
      const next = getPasswordResetFailure(result.error);

      if (next) setFailure({ failure: next, action: 'resend' });
      return;
    }

    clearAfterNewCode();
    setIsJustSent(true);
    // Accepted is all the server says: it never tells whether the address has an account.
    ticket.show({ tone: 'info', text: 'If this address has a verified account, a code will be sent.' });
    inputRef.current?.focus();
  };

  const hint = running === 'verify' ? 'Checking the code…' : isPasted ? 'Pasted from clipboard.' : undefined;

  return {
    hasChallenge,
    email,
    inputRef,
    code,
    changeCode,
    pasteCode,
    codeError,
    hint,
    block,
    isVerifying: running === 'verify',
    isNextDisabled: code.length !== CODE_LENGTH || !!codeError || !!running || verifyWaitSeconds > 0,
    verify,
    isResending: running === 'resend',
    resendSeconds,
    isResendDisabled: resendSeconds > 0 || !!running,
    resend,
    isJustSent,
    failure: failure?.failure ?? null,
    retry: failure?.action === 'resend' ? resend : verify,
  };
};

export default useResetCode;
