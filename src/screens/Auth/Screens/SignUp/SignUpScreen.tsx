import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Input, PasswordInput } from '@components';
import type { ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import AuthLayout from '../../AuthLayout';

import styles from '../style';

interface Props extends ScreenProps<ScreenNames.SIGN_UP_SCREEN> {}

const SignUpScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  return (
    <AuthLayout header="Sign Up">
      <View style={[styles.inputsContainer, styles.pb40]}>
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

        <Text style={styles.infoText}>Must be at least 8 characters</Text>

        <PasswordInput
          iconLeft="lock"
          value={passwordConfirm}
          placeholder="Confirm Password"
          onChangeText={setPasswordConfirm}
          withShadow
        />
      </View>

      <View style={styles.buttonsContainer}>
        <Button title="Sign up" onPress={() => {}} />

        <Button title="Sign in" onPress={() => navigation.navigate(ScreenNames.SIGN_IN_SCREEN)} variant="tertiary" />
      </View>
    </AuthLayout>
  );
};

export default SignUpScreen;
