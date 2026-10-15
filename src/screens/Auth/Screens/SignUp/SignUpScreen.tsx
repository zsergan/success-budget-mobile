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
import useSignUpForm from './useSignUpForm';

import styles from './style';

interface Props extends RootStackScreenProps<ScreenNames.SIGN_UP_SCREEN> {}

const SignUpScreen = ({ navigation }: Props) => {
  const { error } = useAppSelector(selectAuth);
  const { currencies, control, onSubmit, isSubmitting } = useSignUpForm({ navigation });
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
      action={<Button title="Sign up" size="lg" withShadow onPress={onSubmit} isLoading={isSubmitting} />}
      prompt={{
        text: 'Already have an account?',
        linkTitle: 'Sign in',
        onLinkPress: () => navigation.navigate(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true }),
      }}
    >
      <View style={styles.fields}>
        <View style={styles.rowInputs}>
          <Controller
            name="name"
            control={control}
            render={({ field: { onChange, value }, formState: { errors } }) => (
              <Input
                variant="outlined"
                label="Name"
                iconLeft="user"
                value={value}
                placeholder="Your name"
                onChangeText={onChange}
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={styles.name}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            name="currency"
            control={control}
            render={({ field: { onChange, value } }) => (
              <InputPicker
                variant="outlined"
                label="Currency"
                items={currencies}
                selectedValue={value}
                onValueChange={(v) => onChange(v as number)}
                placeholder="Pick"
                containerStyle={styles.currency}
              />
            )}
          />
        </View>

        <Controller
          name="email"
          control={control}
          render={({ field: { onChange, value }, formState: { errors } }) => (
            <Input
              variant="outlined"
              label="Email"
              iconLeft="mail"
              value={value}
              placeholder="you@example.com"
              onChangeText={onChange}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field: { onChange, value }, formState: { errors } }) => (
            <PasswordInput
              variant="outlined"
              label="Password"
              iconLeft="lock"
              value={value}
              placeholder="At least 8 characters"
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          name="passwordConfirm"
          control={control}
          render={({ field: { onChange, value }, formState: { errors } }) => (
            <PasswordInput
              variant="outlined"
              label="Confirm password"
              iconLeft="lock"
              value={value}
              placeholder="Repeat the password"
              onChangeText={onChange}
              error={errors.passwordConfirm?.message}
            />
          )}
        />
      </View>
    </AuthFormLayout>
  );
};

export default SignUpScreen;
