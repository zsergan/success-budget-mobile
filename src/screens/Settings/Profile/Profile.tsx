import { Text, View } from 'react-native';

import { useAppSelector } from '@redux/hooks';
import { selectProfile } from '@redux/state/profile/selectors';

import styles from './style';

const Profile = () => {
  const { name, email, baseCurrency } = useAppSelector(selectProfile);

  const data = [
    { field: 'Name', value: name },
    { field: 'Email', value: email },
    { field: 'Base currency', value: `${baseCurrency?.name} (${baseCurrency?.code})` },
  ];

  return (
    <View style={styles.root}>
      {data.map(({ field, value }) => (
        <View key={field} style={styles.row}>
          <Text style={[styles.cell, styles.name]}>{field}</Text>

          <Text style={[styles.cell, styles.value]}>{value}</Text>
        </View>
      ))}
    </View>
  );
};

export default Profile;
