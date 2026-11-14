import { useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { useToast } from '@hooks';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { verifyEmailMe } from '@redux/state/auth/thunks';
import { selectAuth } from '@redux/state/auth/selectors';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import { getErrorMessage, isApiError } from '@shared/utils';
import { CODE_LENGTH, isFilledAtOnce, readClipboardCode, toCode } from '@screens/Auth/components/CodeInput/code';

type UseVerifyEmailProps = Pick<RootStackScreenProps<ScreenNames.VERIFY_EMAIL_SCREEN>, 'navigation'>;

const useVerifyEmail = ({ navigation }: UseVerifyEmailProps) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  // The address this screen opened for: signing in clears it from the store while the screen is still up.
  const [email] = useState(useAppSelector(selectAuth).userEmail);
  const inputRef = useRef<TextInput>(null);
  // Taps land before a re-render can disable the button; this one request at a time doesn't wait for it.
  const isBusy = useRef(false);

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isPasted, setIsPasted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (email === null) navigation.popTo(ScreenNames.SIGN_UP_SCREEN);
  }, [email, navigation]);

  // A code typed before leaving is not waiting on the way back.
  useEffect(
    () =>
      navigation.addListener('blur', () => {
        setCode('');
        setCodeError(null);
        setIsPasted(false);
      }),
    [navigation],
  );

  const applyCode = (next: string, isPaste: boolean) => {
    if (isVerifying) return;

    setCode(next);
    setIsPasted(isPaste);
    setCodeError(null);
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

  // A success signs in and the app takes over. An already verified account goes to Sign In, which says so once; any
  // other failure stays under the code. An answer after the user left changes nothing.
  const verify = async () => {
    if (isBusy.current || email === null || code.length !== CODE_LENGTH) return;

    isBusy.current = true;
    setIsVerifying(true);
    setIsPasted(false);
    const ticket = toast.begin();

    const result = await dispatch(verifyEmailMe({ email, code }));

    isBusy.current = false;
    setIsVerifying(false);

    if (!verifyEmailMe.rejected.match(result) || !navigation.isFocused()) return;

    if (isApiError(result.payload, 409)) {
      ticket.showAfterNavigation({ tone: 'info', text: 'This email is already verified. Sign in to continue.' });
      navigation.navigate(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true });
    } else {
      setCodeError(getErrorMessage(result.payload));
    }
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
    isVerifyDisabled: code.length !== CODE_LENGTH || !!codeError || isVerifying,
    verify,
  };
};

export default useVerifyEmail;
