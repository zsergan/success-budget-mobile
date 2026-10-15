import { Text, View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, Input } from '@components';
import type { RootStackScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import AuthFormLayout from '@screens/Auth/AuthFormLayout/AuthFormLayout';
import PasswordResetFailureBanner from '@screens/Auth/passwordReset/PasswordResetFailureBanner';
import useResetCodeForm from './useResetCodeForm';

import styles from './style';

interface Props extends RootStackScreenProps<ScreenNames.RESET_CODE_SCREEN> {}

const formatWait = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const ResetCodeScreen = ({ navigation, route }: Props) => {
  const {
    hasChallenge,
    email,
    control,
    changeCode,
    onSubmit,
    isSubmitting,
    isSubmitDisabled,
    resend,
    isResending,
    resendSeconds,
    isResendDisabled,
    failure,
  } = useResetCodeForm({ navigation, route });

  if (!hasChallenge) return null;

  return (
    <AuthFormLayout
      title="Check your email"
      description={`Enter the 6-digit code we sent to ${email ?? ''}`}
      onBackButtonPress={() => navigation.goBack()}
      action={
        <>
          <Button
            title="Next"
            size="lg"
            withShadow
            onPress={onSubmit}
            disabled={isSubmitDisabled}
            isLoading={isSubmitting}
          />
          <Button
            title={isResending ? 'Sending new code…' : 'Send again'}
            variant="tertiary"
            onPress={resend}
            disabled={isResendDisabled}
          />
        </>
      }
      prompt={{
        text: 'Remembered your password?',
        linkTitle: 'Sign In',
        onLinkPress: () => navigation.popTo(ScreenNames.SIGN_IN_SCREEN),
      }}
    >
      {failure && (
        <View style={styles.failure}>
          <PasswordResetFailureBanner failure={failure} kept="code" isRetrying={isSubmitting} onRetry={onSubmit} />
        </View>
      )}

      <Controller
        name="code"
        control={control}
        render={({ field: { ref, onBlur, value }, fieldState: { error } }) => (
          <Input
            ref={ref}
            variant="outlined"
            label="6-digit code"
            value={value}
            placeholder="000000"
            onChangeText={changeCode}
            onBlur={onBlur}
            editable={!isSubmitting && !isResending}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            returnKeyType="next"
            onSubmitEditing={onSubmit}
            error={value.length === 6 ? error?.message : undefined}
          />
        )}
      />

      <Text style={styles.note}>
        {resendSeconds > 0
          ? `No email? Check spam — you can resend in ${formatWait(resendSeconds)}.`
          : 'No email? Check spam, then send a new code.'}
      </Text>
    </AuthFormLayout>
  );
};

export default ResetCodeScreen;
