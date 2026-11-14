import { Text, View } from 'react-native';

import { Button } from '@components';
import { useThemedStyles } from '@hooks';
import type { RootStackScreenProps } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import AuthFormLayout from '@screens/Auth/AuthFormLayout/AuthFormLayout';
import CodeInput from '@screens/Auth/components/CodeInput/CodeInput';
import SentToChip from '@screens/Auth/components/SentToChip/SentToChip';
import useKeyboardLayout from '@screens/Auth/hooks/useKeyboardLayout';
import useVerifyEmail from './useVerifyEmail';
import VerifyEmailFailureBanner from './VerifyEmailFailureBanner';

import createStyles from './style';

interface Props extends RootStackScreenProps<ScreenNames.VERIFY_EMAIL_SCREEN> {}

const VerifyEmailScreen = ({ navigation }: Props) => {
  const styles = useThemedStyles(createStyles);
  const {
    email,
    inputRef,
    code,
    changeCode,
    pasteCode,
    codeError,
    hint,
    isVerifying,
    isVerifyDisabled,
    verify,
    failure,
    isBlocked,
    goBack,
    changeEmail,
    requestAnotherCode,
    openSignIn,
  } = useVerifyEmail({ navigation });
  const { isKeyboardUp, isCompact } = useKeyboardLayout();

  if (email === null) return null;

  return (
    <AuthFormLayout
      title="Check your email"
      description={isCompact ? undefined : 'Enter the 6-digit code we sent to'}
      headerAccessory={!isCompact && <SentToChip email={email} onChange={changeEmail} disabled={isVerifying} />}
      illustration={{ icon: 'mail-check', tone: 'ok' }}
      onBackButtonPress={goBack}
      action={
        <>
          {!isBlocked && !isCompact && <Text style={styles.note}>No email? Check spam, or request another code.</Text>}

          {isBlocked ? (
            <Button title="Request another code" size="lg" withShadow onPress={requestAnotherCode} />
          ) : (
            <Button
              title="Verify email"
              busyTitle="Checking…"
              size="lg"
              withShadow
              onPress={verify}
              disabled={isVerifyDisabled}
              isLoading={isVerifying}
            />
          )}

          {!isBlocked && !isKeyboardUp && (
            <Button
              title="Request another code"
              variant="outline"
              size="lg"
              onPress={requestAnotherCode}
              disabled={isVerifying}
            />
          )}
        </>
      }
      prompt={
        isKeyboardUp ? undefined : { text: 'Already have an account?', linkTitle: 'Sign In', onLinkPress: openSignIn }
      }
    >
      {failure && (
        <View style={styles.failure}>
          <VerifyEmailFailureBanner failure={failure} isRetrying={isVerifying} onRetry={verify} />
        </View>
      )}

      <CodeInput
        ref={inputRef}
        value={code}
        onChangeText={changeCode}
        onPaste={pasteCode}
        error={codeError ?? undefined}
        hint={hint}
        isLocked={isVerifying}
        isDisabled={isBlocked}
      />
    </AuthFormLayout>
  );
};

export default VerifyEmailScreen;
