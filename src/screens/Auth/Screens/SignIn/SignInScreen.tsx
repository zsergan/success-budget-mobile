import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, H, Input, PasswordInput } from '@components';
import type { RootStackScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { useAppSelector } from '@redux/hooks';
import { selectAuth } from '@redux/state/auth/selectors';
import { useAlert } from '@hooks';
import { getErrorMessage } from '@shared/utils';
import AuthLayout from '@screens/Auth/AuthLayout/AuthLayout';
import useSignInForm from './useSignInForm';

import styles from '../style';

interface Props extends RootStackScreenProps<ScreenNames.SIGN_IN_SCREEN> {}

const SignInScreen = ({ navigation }: Props) => {
  const { error } = useAppSelector(selectAuth);
  const { control, onSubmit, isSubmitting } = useSignInForm();
  const { addAlert } = useAlert();

  useEffect(() => {
    if (error) {
      addAlert(getErrorMessage(error));
    }
  }, [error, addAlert]);

  return (
    <AuthLayout onBackButtonPress={() => navigation.goBack()}>
      <View style={styles.root}>
        <H>Sign in</H>

        <View style={styles.container}>
          <Controller
            name="email"
            control={control}
            render={({ field: { onChange, value }, formState: { errors } }) => (
              <Input
                iconLeft="mail"
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
        <Text style={styles.bottomText}>Don&apos;t have an account?</Text>

        <Button
          title="Sign up"
          onPress={() => navigation.navigate(ScreenNames.SIGN_UP_SCREEN, undefined, { pop: true })}
          variant="tertiary"
        />
      </View>
    </AuthLayout>
  );
};

export default SignInScreen;
