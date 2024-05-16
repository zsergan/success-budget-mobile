import { Text, View } from 'react-native';

import { Button } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { logoutMe } from '@redux/state/auth/thunks';
import { selectProfile } from '@redux/state/profile/selectors';

import styles from './style';

const SettingsScreen = () => {
  const dispatch = useAppDispatch();
  const { name, email, baseCurrency } = useAppSelector(selectProfile);

  const handleLogout = () => dispatch(logoutMe());

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Text>{name}</Text>
        <Text>{email}</Text>
        <Text>{baseCurrency?.name}</Text>
        <Button title="Log out" onPress={handleLogout} />
      </View>
    </View>
  );
};

export default SettingsScreen;
