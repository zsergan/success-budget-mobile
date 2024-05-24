import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';

import { Button, RootLayout, SectionTitle } from '@components';
import { useAppDispatch } from '@redux/hooks';
import { logoutMe } from '@redux/state/auth/thunks';
import type { ScreenProps } from '@shared/types';

import Profile from './Profile';
import Wallets from './Wallets';

import styles from './style';

interface Props extends ScreenProps {}

const SettingsScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();

  const handleLogout = () => dispatch(logoutMe());

  const blocks = [
    {
      title: 'Profile',
      button: <Button style={styles.button} icon={<MaterialIcons name="logout" size={24} />} onPress={handleLogout} />,
      content: <Profile />,
    },
    {
      title: 'Wallets',
      button: (
        <Button
          style={styles.button}
          icon={<Entypo name="plus" size={24} />}
          onPress={() => navigation.navigate('New wallet')}
        />
      ),
      content: <Wallets />,
    },
  ];

  return (
    <RootLayout scrollable>
      <View style={styles.profile}>
        {blocks.map((block) => (
          <View key={block.title}>
            <SectionTitle title={block.title} button={block.button} />

            {block.content}
          </View>
        ))}
      </View>
    </RootLayout>
  );
};

export default SettingsScreen;
