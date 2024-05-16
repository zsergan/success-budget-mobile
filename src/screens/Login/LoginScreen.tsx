import { TextInput, View } from 'react-native';
import { useState } from 'react';

import { useAppDispatch } from '@redux/hooks';
import { Button } from '@components';
import { loginMe } from '@redux/state/auth/thunks';

import styles from './style';

const LoginScreen = () => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => dispatch(loginMe({ email, password }));

  return (
    <View style={styles.root}>
      <View style={styles.inputsContainer}>
        <TextInput
          style={styles.input}
          value={email}
          placeholder="Email"
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          value={password}
          placeholder="Password"
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <Button title="Login" onPress={handleLogin} />
      </View>
    </View>
  );
};

export default LoginScreen;
