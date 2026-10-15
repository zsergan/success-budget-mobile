import { useEffect } from 'react';
import { View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, Input, InputPicker, PasswordInput } from '@components';
import type { RootStackScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { useAppSelector } from '@redux/hooks';
import { selectAuth } from '@redux/state/auth/selectors';
import { useAlert } from '@hooks';
import { getErrorMessage } from '@shared/utils';
import AuthFormLayout from '@screens/Auth/AuthFormLayout/AuthFormLayout';
import TextLink from '@screens/Auth/TextLink/TextLink';
import useCurrencyOptions from './useCurrencyOptions';
import useSignUpForm from './useSignUpForm';

import styles from './style';

interface Props extends RootStackScreenProps<ScreenNames.SIGN_UP_SCREEN> {}

const SignUpScreen = ({ navigation }: Props) => {
  const { error } = useAppSelector(selectAuth);
  const { control, onSubmit, isSubmitting } = useSignUpForm({ navigation });
  const currencies = useCurrencyOptions();
  const { addAlert } = useAlert();

  useEffect(() => {
    if (error) {
      addAlert(getErrorMessage(error));
    }
  }, [error, addAlert]);

  return (
    <AuthFormLayout
      title="Create your account"
      description="Name, email, password and the currency of your personal space."
      onBackButtonPress={() => navigation.goBack()}
      action={<Button title="Create account" size="lg" withShadow onPress={onSubmit} isLoading={isSubmitting} />}
      prompt={{
        text: 'Already have an account?',
        linkTitle: 'Sign In',
        onLinkPress: () => navigation.navigate(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true }),
      }}
    >
      <View style={styles.fields}>
        <Controller
          name="name"
          control={control}
          render={({ field: { onChange, onBlur, value }, formState: { errors } }) => (
            <Input
              variant="outlined"
              label="Name"
              iconLeft="user"
              value={value}
              placeholder="What should we call you"
              onChangeText={onChange}
              onBlur={onBlur}
              textContentType="name"
              autoComplete="name"
              autoCapitalize="words"
              autoCorrect={false}
              error={errors.name?.message}
            />
          )}
        />

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
              placeholder="At least 8 characters"
              onChangeText={onChange}
              onBlur={onBlur}
              textContentType="newPassword"
              autoComplete="new-password"
              hint="At least 8 characters, with a letter and a digit."
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          name="passwordConfirm"
          control={control}
          render={({ field: { onChange, onBlur, value }, formState: { errors } }) => (
            <PasswordInput
              variant="outlined"
              label="Confirm password"
              iconLeft="lock"
              value={value}
              placeholder="Repeat the password"
              onChangeText={onChange}
              onBlur={onBlur}
              textContentType="newPassword"
              autoComplete="new-password"
              error={errors.passwordConfirm?.message}
            />
          )}
        />

        <View>
          <Controller
            name="currency"
            control={control}
            render={({ field: { onChange, value }, formState: { errors } }) => (
              <InputPicker
                variant="outlined"
                label="Currency of your space"
                iconLeft="currency"
                items={currencies.options}
                selectedValue={value}
                onValueChange={(v) => onChange(v as number)}
                placeholder={currencies.isLoading ? 'Loading currencies…' : 'Pick a currency'}
                isLoading={currencies.isLoading}
                disabled={currencies.hasError}
                hint="Set once. Every amount in this space is kept in it."
                error={currencies.hasError ? 'Couldn’t load the currencies.' : errors.currency?.message}
              />
            )}
          />

          {currencies.hasError && (
            <View style={styles.retryCurrencies}>
              <TextLink title="Try again" onPress={currencies.retry} />
            </View>
          )}
        </View>
      </View>
    </AuthFormLayout>
  );
};

export default SignUpScreen;
