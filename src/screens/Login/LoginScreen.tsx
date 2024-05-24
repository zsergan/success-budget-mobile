import { View } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppDispatch } from '@redux/hooks';
import { Button, Input } from '@components';
import { loginMe } from '@redux/state/auth/thunks';

import styles from './style';

const LoginScreen = () => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => dispatch(loginMe({ email, password }));

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#DDE1E4', '#95A1AC']} style={styles.background} />

      <View style={styles.inputsContainer}>
        <Input value={email} placeholder="Email" onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} />

        <Input
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
