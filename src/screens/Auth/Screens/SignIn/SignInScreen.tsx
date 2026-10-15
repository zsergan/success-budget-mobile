import { View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, Input, PasswordInput, TextLink } from '@components';
import type { RootStackScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import AuthFormLayout from '@screens/Auth/AuthFormLayout/AuthFormLayout';
import SignInFailureBanner from './components/SignInFailureBanner/SignInFailureBanner';
import useSignInForm from './useSignInForm';

import styles from './style';

interface Props extends RootStackScreenProps<ScreenNames.SIGN_IN_SCREEN> {}

const SignInScreen = ({ navigation }: Props) => {
  const { control, onSubmit, isSubmitting, isSubmitDisabled, failure, focusField } = useSignInForm();
  const isWrongCredentials = failure?.kind === 'credentials';

  return (
    <AuthFormLayout
      title="Welcome back"
      description="Sign in to your Success Budget account."
      onBackButtonPress={() => navigation.goBack()}
      action={
        <Button
          title="Sign In"
          size="lg"
          withShadow
          onPress={onSubmit}
          disabled={isSubmitDisabled}
          isLoading={isSubmitting}
        />
      }
      prompt={{
        text: 'No account yet?',
        linkTitle: 'Create account',
        onLinkPress: () => navigation.navigate(ScreenNames.SIGN_UP_SCREEN, undefined, { pop: true }),
      }}
    >
      {failure && (
        <View style={styles.failure}>
          <SignInFailureBanner failure={failure} isRetrying={isSubmitting} onRetry={onSubmit} />
        </View>
      )}

      <View style={styles.fields}>
        <Controller
          name="email"
          control={control}
          render={({ field: { ref, onChange, onBlur, value }, formState: { errors } }) => (
            <Input
              ref={ref}
              variant="outlined"
              label="Email"
              iconLeft="mail"
              value={value}
              placeholder="you@example.com"
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              textContentType="username"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => focusField('password')}
              error={
                errors.email?.message ??
                (isWrongCredentials ? 'No account matches this email and password.' : undefined)
              }
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field: { ref, onChange, onBlur, value }, formState: { errors } }) => (
            <PasswordInput
              ref={ref}
              variant="outlined"
              label="Password"
              iconLeft="lock"
              value={value}
              placeholder="••••••••"
              onChangeText={onChange}
              onBlur={onBlur}
              textContentType="password"
              autoComplete="current-password"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              error={errors.password?.message}
            />
          )}
        />
      </View>

      <View style={styles.forgotPassword}>
        <TextLink title="Forgot password?" onPress={() => {}} />
      </View>
    </AuthFormLayout>
  );
};

export default SignInScreen;
