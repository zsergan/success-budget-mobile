import { View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, Input } from '@components';
import type { RootStackScreenProps } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import AuthFormLayout from '@screens/Auth/AuthFormLayout/AuthFormLayout';
import PasswordResetFailureBanner from '@screens/Auth/passwordReset/PasswordResetFailureBanner';
import useForgotPasswordForm from './useForgotPasswordForm';

import styles from './style';

interface Props extends RootStackScreenProps<ScreenNames.FORGOT_PASSWORD_SCREEN> {}

const ForgotPasswordScreen = ({ navigation, route }: Props) => {
  const { control, onSubmit, isSubmitting, isSubmitDisabled, failure } = useForgotPasswordForm({
    navigation,
    initialEmail: route.params?.email,
  });

  return (
    <AuthFormLayout
      title="Reset password"
      description="We’ll send a 6-digit code to your email. It stays valid for 30 minutes."
      onBackButtonPress={() => navigation.goBack()}
      action={
        <>
          <Button
            title="Send code"
            size="lg"
            withShadow
            onPress={onSubmit}
            disabled={isSubmitDisabled}
            isLoading={isSubmitting}
          />
          <Button
            title="Back to sign in"
            variant="tertiary"
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          />
        </>
      }
    >
      {failure && (
        <View style={styles.failure}>
          <PasswordResetFailureBanner failure={failure} kept="email" isRetrying={isSubmitting} onRetry={onSubmit} />
        </View>
      )}

      <Controller
        name="email"
        control={control}
        render={({ field: { ref, onChange, onBlur, value }, fieldState: { error, isDirty } }) => (
          <Input
            ref={ref}
            variant="outlined"
            label="Account email"
            iconLeft="mail"
            value={value}
            placeholder="you@example.com"
            onChangeText={onChange}
            onBlur={onBlur}
            editable={!isSubmitting}
            keyboardType="email-address"
            textContentType="username"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
            error={isDirty ? error?.message : undefined}
          />
        )}
      />
    </AuthFormLayout>
  );
};

export default ForgotPasswordScreen;
