import { Text, View } from 'react-native';

import { CircleIcon } from '@components';
import { useAppSelector } from '@redux/hooks';
import { selectProfile } from '@redux/state/profile/selectors';

import styles from './style';

const Profile = () => {
  const { name, email } = useAppSelector(selectProfile);

  return (
    <View style={styles.root}>
      <CircleIcon icon="person" size="xl" border />

      <View style={styles.profile}>
        <Text style={styles.name}>{name}</Text>

        <Text style={styles.email}>{email}</Text>
      </View>
    </View>
  );
};

export default Profile;
