import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, H, Input, PasswordInput } from '@components';
import type { ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { useAppSelector } from '@redux/hooks';
import { selectAuth } from '@redux/state/auth/selectors';
import { useAlert } from '@hooks';
import AuthLayout from '../../AuthLayout';
import useSignInForm from './useSignInForm';

import styles from '../style';

interface Props extends ScreenProps<ScreenNames.SIGN_IN_SCREEN> {}

const SignInScreen = ({ navigation }: Props) => {
  const { error } = useAppSelector(selectAuth);
  const { control, onSubmit, isSubmitting } = useSignInForm();
  const { addAlert } = useAlert();

  useEffect(() => {
    const errorMessage = typeof error?.message === 'string' ? error.message : error?.message[0].error;

    if (errorMessage) {
      addAlert(errorMessage, 'error');
    }
  }, [error, addAlert]);

  return (
    <AuthLayout>
      <View style={styles.root}>
        <H>Sign in</H>

        <View style={styles.container}>
          <Controller
            name="email"
            control={control}
            render={({ field: { onChange, value }, formState: { errors } }) => (
              <Input
                iconLeft="email"
                value={value}
                placeholder="E-mail"
                onChangeText={onChange}
                autoCapitalize="none"
                autoCorrect={false}
                withShadow
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field: { onChange, value }, formState: { errors } }) => (
              <PasswordInput
                iconLeft="lock"
                value={value}
                placeholder="Password"
                onChangeText={onChange}
                withShadow
                error={errors.password?.message}
              />
            )}
          />
        </View>

        <View style={styles.container}>
          <Button title="Sign in" onPress={onSubmit} disabled={isSubmitting} />

          <Button title="Reset password" onPress={() => {}} variant="tertiary" />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.bottomText}>Don't have an account?</Text>

        <Button title="Sign up" onPress={() => navigation.navigate(ScreenNames.SIGN_UP_SCREEN)} variant="tertiary" />
      </View>
    </AuthLayout>
  );
};

export default SignInScreen;
