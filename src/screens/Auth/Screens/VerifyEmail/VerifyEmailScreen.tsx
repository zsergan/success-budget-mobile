import { Text } from 'react-native';

import { Button } from '@components';
import { useThemedStyles } from '@hooks';
import type { RootStackScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import AuthFormLayout from '@screens/Auth/AuthFormLayout/AuthFormLayout';
import CodeInput from '@screens/Auth/components/CodeInput/CodeInput';
import SentToChip from '@screens/Auth/components/SentToChip/SentToChip';
import useKeyboardLayout from '@screens/Auth/hooks/useKeyboardLayout';
import useVerifyEmail from './useVerifyEmail';

import createStyles from './style';

interface Props extends RootStackScreenProps<ScreenNames.VERIFY_EMAIL_SCREEN> {}

const VerifyEmailScreen = ({ navigation }: Props) => {
  const styles = useThemedStyles(createStyles);
  const { email, inputRef, code, changeCode, pasteCode, codeError, hint, isVerifying, isVerifyDisabled, verify } =
    useVerifyEmail({ navigation });
  const { isKeyboardUp, isCompact } = useKeyboardLayout();

  if (email === null) return null;

  return (
    <AuthFormLayout
      title="Check your email"
      description={isCompact ? undefined : 'Enter the 6-digit code we sent to'}
      headerAccessory={
        !isCompact && (
          <SentToChip
            email={email}
            onChange={() => navigation.popTo(ScreenNames.SIGN_UP_SCREEN, { focusEmail: true })}
            disabled={isVerifying}
          />
        )
      }
      illustration={{ icon: 'mail-check', tone: 'ok' }}
      onBackButtonPress={() => navigation.popTo(ScreenNames.SIGN_UP_SCREEN)}
      action={
        <>
          {!isCompact && <Text style={styles.note}>No email? Check spam, or request another code.</Text>}

          <Button
            title="Verify email"
            busyTitle="Checking…"
            size="lg"
            withShadow
            onPress={verify}
            disabled={isVerifyDisabled}
            isLoading={isVerifying}
          />

          {!isKeyboardUp && (
            <Button
              title="Request another code"
              variant="outline"
              size="lg"
              onPress={() => navigation.popTo(ScreenNames.SIGN_UP_SCREEN, { notice: 'requestAnotherCode' })}
              disabled={isVerifying}
            />
          )}
        </>
      }
      prompt={
        isKeyboardUp
          ? undefined
          : {
              text: 'Already have an account?',
              linkTitle: 'Sign In',
              onLinkPress: () => navigation.navigate(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true }),
            }
      }
    >
      <CodeInput
        ref={inputRef}
        value={code}
        onChangeText={changeCode}
        onPaste={pasteCode}
        error={codeError ?? undefined}
        hint={hint}
        isLocked={isVerifying}
      />
    </AuthFormLayout>
  );
};

export default VerifyEmailScreen;
