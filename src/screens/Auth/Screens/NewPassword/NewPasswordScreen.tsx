import { View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Banner, Button, PasswordInput } from '@components';
import type { RootStackScreenProps } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import AuthFormLayout from '@screens/Auth/AuthFormLayout/AuthFormLayout';
import PasswordResetFailureBanner from '@screens/Auth/passwordReset/PasswordResetFailureBanner';
import useKeyboardLayout from '@screens/Auth/passwordReset/useKeyboardLayout';
import PasswordRules from './components/PasswordRules/PasswordRules';
import useNewPasswordForm from './useNewPasswordForm';

import styles from './style';

interface Props extends RootStackScreenProps<ScreenNames.NEW_PASSWORD_SCREEN> {}

const NewPasswordScreen = ({ navigation }: Props) => {
  const {
    isAuthorized,
    email,
    control,
    onSubmit,
    isSubmitting,
    failure,
    mayHaveSaved,
    signInInstead,
    passwordRules,
    isPasswordValid,
    isConfirmValid,
    focusField,
  } = useNewPasswordForm({ navigation });
  const { isKeyboardUp } = useKeyboardLayout();

  if (!isAuthorized) return null;

  return (
    <AuthFormLayout
      title="Create a new password"
      description={isKeyboardUp ? undefined : `Code confirmed for ${email ?? ''}.`}
      illustration={failure ? undefined : { icon: 'lock-open', tone: 'neutral' }}
      onBackButtonPress={() => navigation.goBack()}
      action={
        <>
          <Button
            title="Save new password"
            busyTitle="Saving…"
            size="lg"
            withShadow
            onPress={onSubmit}
            isLoading={isSubmitting}
          />
          {mayHaveSaved && !isKeyboardUp && (
            <Button
              title="Sign in with the new password"
              variant="outline"
              size="lg"
              onPress={signInInstead}
              disabled={isSubmitting}
            />
          )}
        </>
      }
    >
      {failure && (
        <View style={styles.failure}>
          {failure.kind === 'connection' ? (
            // No answer is not a refusal: the password may have changed, so this never reads as a failure.
            <Banner
              variant="card"
              tone="warn"
              icon="offline"
              title="Couldn’t confirm the new password"
              text="The server didn’t answer, so the password may already have changed. Your new password is kept: retry, or sign in with it."
              actionLabel="Retry"
              actionIcon="refresh"
              isBusy={isSubmitting}
              onAction={onSubmit}
            />
          ) : (
            <PasswordResetFailureBanner
              failure={failure}
              kept="password"
              isRetrying={isSubmitting}
              onRetry={onSubmit}
            />
          )}
        </View>
      )}

      <View style={styles.fields}>
        <View style={styles.passwordField}>
          <Controller
            name="password"
            control={control}
            render={({ field: { ref, onChange, onBlur, value }, fieldState: { error } }) => (
              <PasswordInput
                ref={ref}
                variant="outlined"
                label="New password"
                iconLeft="lock"
                value={value}
                placeholder="At least 8 characters"
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!isSubmitting}
                textContentType="newPassword"
                autoComplete="new-password"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => focusField('passwordConfirm')}
                hint="At least 8 characters, including a letter and a number."
                isValid={isPasswordValid}
                error={error?.message}
              />
            )}
          />

          <PasswordRules rules={passwordRules} />
        </View>

        <Controller
          name="passwordConfirm"
          control={control}
          render={({ field: { ref, onChange, onBlur, value }, fieldState: { error } }) => (
            <PasswordInput
              ref={ref}
              variant="outlined"
              label="Confirm password"
              iconLeft="lock"
              value={value}
              placeholder="Repeat the new password"
              onChangeText={onChange}
              onBlur={onBlur}
              editable={!isSubmitting}
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              isValid={isConfirmValid}
              error={error?.message}
            />
          )}
        />
      </View>
    </AuthFormLayout>
  );
};

export default NewPasswordScreen;
