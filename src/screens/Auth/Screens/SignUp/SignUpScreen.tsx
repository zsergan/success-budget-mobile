import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, H, Input, InputPicker, PasswordInput } from '@components';
import type { ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { useAppSelector } from '@redux/hooks';
import { selectAuth } from '@redux/state/auth/selectors';
import { useAlert } from '@hooks';
import { getErrorMessage } from '@shared/utils';
import AuthLayout from '@screens/Auth/AuthLayout/AuthLayout';
import useSignUpForm from './useSignUpForm';

import styles from '../style';

interface Props extends ScreenProps<ScreenNames.SIGN_UP_SCREEN> {}

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
    <AuthLayout onBackButtonPress={() => navigation.goBack()}>
      <View style={styles.root}>
        <H>Sign up</H>

        <View style={styles.container}>
          <View style={styles.rowInputs}>
            <Controller
              name="name"
              control={control}
              render={({ field: { onChange, value }, formState: { errors } }) => (
                <Input
                  iconLeft="user"
                  value={value}
                  placeholder="Name"
                  onChangeText={onChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  containerStyle={styles.name}
                  withShadow
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              name="currency"
              control={control}
              render={({ field: { onChange, value } }) => (
                <InputPicker
                  items={currencies}
                  selectedValue={value}
                  onValueChange={(v) => onChange(v as number)}
                  withShadow
                  placeholder="Currency"
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

          <Controller
            name="passwordConfirm"
            control={control}
            render={({ field: { onChange, value }, formState: { errors } }) => (
              <PasswordInput
                iconLeft="lock"
                value={value}
                placeholder="Confirm Password"
                onChangeText={onChange}
                withShadow
                error={errors.passwordConfirm?.message}
              />
            )}
          />
        </View>

        <View style={styles.container}>
          <Button title="Sign up" onPress={onSubmit} disabled={isSubmitting} />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.bottomText}>Already have an account?</Text>

        <Button title="Sign in" onPress={() => navigation.navigate(ScreenNames.SIGN_IN_SCREEN)} variant="tertiary" />
      </View>
    </AuthLayout>
  );
};

export default SignUpScreen;
