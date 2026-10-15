import { useEffect } from 'react';
import { View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, Input, PasswordInput } from '@components';
import type { RootStackScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { useAppSelector } from '@redux/hooks';
import { selectAuth } from '@redux/state/auth/selectors';
import { useAlert } from '@hooks';
import { getErrorMessage } from '@shared/utils';
import AuthFormLayout from '@screens/Auth/AuthFormLayout/AuthFormLayout';
import TextLink from '@screens/Auth/TextLink/TextLink';
import useSignInForm from './useSignInForm';

import styles from './style';

interface Props extends RootStackScreenProps<ScreenNames.SIGN_IN_SCREEN> {}

const SignInScreen = ({ navigation }: Props) => {
  const { error } = useAppSelector(selectAuth);
  const { control, onSubmit, isSubmitting, isSubmitDisabled } = useSignInForm();
  const { addAlert } = useAlert();

  useEffect(() => {
    if (error) {
      addAlert(getErrorMessage(error));
    }
  }, [error, addAlert]);

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
      <View style={styles.fields}>
        <Controller
          name="email"
          control={control}
          render={({ field: { onChange, onBlur, value }, formState: { errors } }) => (
            <Input
              variant="outlined"
              label="Email"
              iconLeft="mail"
              value={value}
              placeholder="you@example.com"
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field: { onChange, onBlur, value }, formState: { errors } }) => (
            <PasswordInput
              variant="outlined"
              label="Password"
              iconLeft="lock"
              value={value}
              placeholder="••••••••"
              onChangeText={onChange}
              onBlur={onBlur}
              textContentType="password"
              autoComplete="current-password"
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
