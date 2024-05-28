import { View } from 'react-native';
import { useState } from 'react';

import { useAppDispatch } from '@redux/hooks';
import { Button, Input, PasswordInput } from '@components';
import { loginMe } from '@redux/state/auth/thunks';
import type { ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import AuthLayout from '../../AuthLayout';

import styles from '../style';

interface Props extends ScreenProps<ScreenNames.SIGN_IN_SCREEN> {}

const SignInScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => dispatch(loginMe({ email, password }));

  return (
    <AuthLayout header="Sign in">
      <View style={styles.inputsContainer}>
        <Input
          iconLeft="email"
          value={email}
          placeholder="E-mail"
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          withShadow
        />

        <PasswordInput iconLeft="lock" value={password} placeholder="Password" onChangeText={setPassword} withShadow />
      </View>

      <Button title="Reset password" style={styles.resetPasswordButton} onPress={() => {}} variant="tertiary" />

      <View style={styles.buttonsContainer}>
        <Button title="Sign in" onPress={handleLogin} />

        <Button title="Sign up" onPress={() => navigation.navigate(ScreenNames.SIGN_UP_SCREEN)} variant="tertiary" />
      </View>
    </AuthLayout>
  );
};

export default SignInScreen;
