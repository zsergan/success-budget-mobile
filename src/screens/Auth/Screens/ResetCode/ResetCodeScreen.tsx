import { Text, View } from 'react-native';

import { Button } from '@components';
import { useThemedStyles } from '@hooks';
import type { RootStackScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import AuthFormLayout from '@screens/Auth/AuthFormLayout/AuthFormLayout';
import type { PasswordResetFailure } from '@screens/Auth/passwordReset/passwordResetFailure';
import PasswordResetFailureBanner from '@screens/Auth/passwordReset/PasswordResetFailureBanner';
import useKeyboardLayout from '@screens/Auth/passwordReset/useKeyboardLayout';
import CodeInput from './components/CodeInput/CodeInput';
import SentToChip from './components/SentToChip/SentToChip';
import type { CodeBlock } from './useResetCode';
import useResetCode from './useResetCode';

import createStyles from './style';

interface Props extends RootStackScreenProps<ScreenNames.RESET_CODE_SCREEN> {}

const BLOCK_FAILURES: Record<CodeBlock, PasswordResetFailure> = {
  expired: { kind: 'codeUnusable', reason: 'expired' },
  attempts: { kind: 'codeUnusable', reason: 'attempts' },
  unknown: { kind: 'codeUnusable' },
  authorizationExpired: { kind: 'authorizationInvalid' },
};

const formatWait = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const ResetCodeScreen = ({ navigation, route }: Props) => {
  const styles = useThemedStyles(createStyles);
  const {
    hasChallenge,
    email,
    inputRef,
    code,
    changeCode,
    pasteCode,
    codeError,
    hint,
    block,
    isVerifying,
    isNextDisabled,
    verify,
    isResending,
    resendSeconds,
    isResendDisabled,
    resend,
    isJustSent,
    failure,
    retry,
  } = useResetCode({ navigation, route });
  const { isKeyboardUp, isCompact } = useKeyboardLayout();

  if (!hasChallenge || email === null) return null;

  const wait = formatWait(resendSeconds);
  const shownFailure = failure ?? (block && BLOCK_FAILURES[block]);
  const note = block
    ? null
    : isJustSent && resendSeconds > 0
      ? `New code sent. Earlier codes no longer work. You can resend in ${wait}.`
      : resendSeconds > 0
        ? `No email? Check spam — you can resend in ${wait}.`
        : 'No email? Check spam, then send a new code.';

  return (
    <AuthFormLayout
      title="Check your email"
      description={isCompact ? undefined : 'Enter the 6-digit code we sent to'}
      headerAccessory={
        !isCompact && <SentToChip email={email} onChange={() => navigation.goBack()} disabled={isVerifying} />
      }
      illustration={{ icon: 'mail-check', tone: 'ok' }}
      onBackButtonPress={() => navigation.goBack()}
      action={
        <>
          {note && !isCompact && (
            <Text style={styles.note} accessibilityLiveRegion="polite">
              {note}
            </Text>
          )}

          {block ? (
            <Button
              title={resendSeconds > 0 ? `Send new code in ${wait}` : 'Send new code'}
              busyTitle="Sending new code…"
              size="lg"
              withShadow
              onPress={resend}
              disabled={isResendDisabled}
              isLoading={isResending}
            />
          ) : (
            <Button
              title="Next"
              busyTitle="Checking…"
              size="lg"
              withShadow
              onPress={verify}
              disabled={isNextDisabled}
              isLoading={isVerifying}
            />
          )}

          {!block && !isKeyboardUp && (
            <Button
              title={isResending ? 'Sending new code…' : 'Send again'}
              variant="outline"
              size="lg"
              onPress={resend}
              disabled={isResendDisabled}
            />
          )}
        </>
      }
      prompt={
        isKeyboardUp
          ? undefined
          : {
              text: 'Remembered your password?',
              linkTitle: 'Sign In',
              onLinkPress: () => navigation.popTo(ScreenNames.SIGN_IN_SCREEN),
            }
      }
    >
      {shownFailure && (
        <View style={styles.failure}>
          <PasswordResetFailureBanner
            failure={shownFailure}
            kept="code"
            isRetrying={isVerifying || isResending}
            onRetry={retry}
          />
        </View>
      )}

      <CodeInput
        ref={inputRef}
        value={code}
        onChangeText={changeCode}
        onPaste={pasteCode}
        error={codeError ?? undefined}
        hint={hint}
        isLocked={isVerifying || isResending}
        isDisabled={!!block}
      />
    </AuthFormLayout>
  );
};

export default ResetCodeScreen;
