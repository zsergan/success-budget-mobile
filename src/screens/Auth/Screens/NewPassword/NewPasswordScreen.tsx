import { View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, PasswordInput } from '@components';
import type { RootStackScreenProps } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import AuthFormLayout from '@screens/Auth/AuthFormLayout/AuthFormLayout';
import PasswordResetFailureBanner from '@screens/Auth/passwordReset/PasswordResetFailureBanner';
import useNewPasswordForm from './useNewPasswordForm';

import styles from './style';

interface Props extends RootStackScreenProps<ScreenNames.NEW_PASSWORD_SCREEN> {}

const NewPasswordScreen = ({ navigation }: Props) => {
  const { isAuthorized, email, control, onSubmit, isSubmitting, failure, focusField } = useNewPasswordForm({
    navigation,
  });

  if (!isAuthorized) return null;

  return (
    <AuthFormLayout
      title="Create a new password"
      description={`Code confirmed for ${email ?? ''}.`}
      onBackButtonPress={() => navigation.goBack()}
      action={<Button title="Save new password" size="lg" withShadow onPress={onSubmit} isLoading={isSubmitting} />}
    >
      {failure && (
        <View style={styles.failure}>
          <PasswordResetFailureBanner failure={failure} kept="password" isRetrying={isSubmitting} onRetry={onSubmit} />
        </View>
      )}

      <View style={styles.fields}>
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
              error={error?.message}
            />
          )}
        />

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
              error={error?.message}
            />
          )}
        />
      </View>
    </AuthFormLayout>
  );
};

export default NewPasswordScreen;
