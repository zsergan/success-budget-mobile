import { useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { usePreventRemove, type NavigationAction } from '@react-navigation/native';

import { useToast } from '@hooks';
import useSecondsUntil from '@hooks/useSecondsUntil';
import { useAppDispatch, useAppSelector, useAppStore } from '@redux/hooks';
import { verificationAbandoned } from '@redux/state/auth/actions';
import { verifyEmailMe } from '@redux/state/auth/thunks';
import { selectAuth } from '@redux/state/auth/selectors';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import { CODE_LENGTH, isFilledAtOnce, readClipboardCode, toCode } from '@screens/Auth/components/CodeInput/code';
import type { VerifyEmailFailure } from './verifyEmailFailure';
import { getVerifyEmailFailure } from './verifyEmailFailure';

type UseVerifyEmailProps = Pick<RootStackScreenProps<ScreenNames.VERIFY_EMAIL_SCREEN>, 'navigation'>;

type CodeBlock = Extract<VerifyEmailFailure, { kind: 'codeUnusable' }>;

const useVerifyEmail = ({ navigation }: UseVerifyEmailProps) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const store = useAppStore();
  const { userEmail } = useAppSelector(selectAuth);
  // The address this screen opened for: signing in clears it from the store while the screen is still up.
  const [email] = useState(userEmail);
  const inputRef = useRef<TextInput>(null);
  // The attempt whose answer this screen acts on. Taps land before a re-render can disable the button, and an
  // answer to an attempt left behind must not touch the one running now.
  const currentRequestId = useRef<string | null>(null);

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isPasted, setIsPasted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [failure, setFailure] = useState<VerifyEmailFailure | null>(null);
  // Why the code on screen can't be used any more; only another code moves on from here.
  const [block, setBlock] = useState<CodeBlock | null>(null);
  // A removal the guard let through, replayed once the guard is down.
  const [released, setReleased] = useState<NavigationAction | null>(null);

  const waitSeconds = useSecondsUntil(failure?.kind === 'rateLimited' ? failure.retryAt : undefined);

  useEffect(() => {
    if (email === null) navigation.popTo(ScreenNames.SIGN_UP_SCREEN);
  }, [email, navigation]);

  useEffect(() => {
    // Leaving ends the attempt still waiting for its answer, and a code typed before is not waiting on the way back.
    const leave = () => {
      currentRequestId.current = null;
      dispatch(verificationAbandoned());
      setIsVerifying(false);
      setCode('');
      setCodeError(null);
      setIsPasted(false);
      setFailure(null);
      setReleased(null);
    };
    const unsubscribe = navigation.addListener('blur', leave);

    return () => {
      unsubscribe();
      currentRequestId.current = null;
      dispatch(verificationAbandoned());
    };
  }, [dispatch, navigation]);

  // The token write and the sign-in that follows are one step: the screen stays until both are done. Read from the
  // store, since a render may not have happened yet between the server's answer and a tap or a swipe.
  const isCommitting = () => store.getState().auth.verification?.isCommitting === true;

  // The guard is up for as long as the route lives, so a native swipe is stopped before it moves the screen, not after.
  usePreventRemove(released === null, ({ data }) => {
    if (isCommitting()) return;

    // The attempt ends before the screen goes, so its late answer can no longer save a token.
    currentRequestId.current = null;
    dispatch(verificationAbandoned());
    setReleased(data.action);
  });

  useEffect(() => {
    if (released === null) return;

    navigation.dispatch(released);
  }, [navigation, released]);

  const applyCode = (next: string, isPaste: boolean) => {
    if (isVerifying || block) return;

    setCode(next);
    setIsPasted(isPaste);
    setCodeError(null);
    // A wait set by the server outlives typing; anything else was about the code that was there before.
    setFailure((current) => (current?.kind === 'rateLimited' ? current : null));
  };

  const changeCode = (text: string) => {
    const next = toCode(text);

    applyCode(next, isFilledAtOnce(code, next));
  };

  const pasteCode = async () => {
    const pasted = await readClipboardCode();

    if (pasted !== '') applyCode(pasted, true);

    inputRef.current?.focus();
  };

  const goToSignIn = (text: string) => {
    toast.begin().showAfterNavigation({ tone: 'info', text });
    navigation.navigate(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true });
  };

  // A success signs in and the app takes over; every failure names its next step here or on Sign In.
  const verify = async () => {
    if (currentRequestId.current || email === null || block || code.length !== CODE_LENGTH || waitSeconds > 0) return;

    const request = dispatch(verifyEmailMe({ email, code }));

    currentRequestId.current = request.requestId;
    setIsVerifying(true);
    setIsPasted(false);
    setFailure(null);

    const result = await request;

    if (currentRequestId.current !== request.requestId) return;

    currentRequestId.current = null;
    setIsVerifying(false);

    if (!verifyEmailMe.rejected.match(result)) return;

    const next = getVerifyEmailFailure(result.payload);

    switch (next?.kind) {
      case undefined:
        return;
      case 'codeInvalid':
        return setCodeError('That code doesn’t match. Check the email and try again.');
      case 'codeUnusable':
        setCode('');
        return setBlock(next);
      case 'alreadyVerified':
        return goToSignIn('This email is already verified. Sign in to continue.');
      case 'sessionNotSaved':
        return goToSignIn('Your email is verified. Sign in to continue.');
      default:
        return setFailure(next);
    }
  };

  // While the session is being committed nothing leaves the screen.
  const whenFree = (action: () => void) => () => {
    if (!isCommitting()) action();
  };

  return {
    email,
    inputRef,
    code,
    changeCode,
    pasteCode,
    codeError,
    hint: isVerifying ? 'Checking the code…' : isPasted ? 'Pasted from clipboard.' : undefined,
    isVerifying,
    isVerifyDisabled: code.length !== CODE_LENGTH || !!codeError || isVerifying || waitSeconds > 0,
    verify,
    failure: block ?? failure,
    isBlocked: block !== null,
    goBack: whenFree(() => navigation.popTo(ScreenNames.SIGN_UP_SCREEN)),
    changeEmail: whenFree(() => navigation.popTo(ScreenNames.SIGN_UP_SCREEN, { focusEmail: true })),
    requestAnotherCode: whenFree(() => navigation.popTo(ScreenNames.SIGN_UP_SCREEN, { notice: 'requestAnotherCode' })),
    openSignIn: whenFree(() => navigation.navigate(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true })),
  };
};

export default useVerifyEmail;
