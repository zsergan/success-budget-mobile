import { Text, View } from 'react-native';

import { CircleIcon } from '@components';
import { useThemedStyles } from '@hooks';
import { useGetProfileQuery } from '@redux/state/profile/api';

import createStyles from './style';

const Profile = () => {
  const styles = useThemedStyles(createStyles);
  const { name, email } = useGetProfileQuery().currentData ?? {};

  return (
    <View style={styles.root}>
      <CircleIcon icon="user" size="xl" border />

      <View style={styles.profile}>
        <Text style={styles.name}>{name}</Text>

        <Text style={styles.email}>{email}</Text>
      </View>
    </View>
  );
};

export default Profile;
