import { View } from 'react-native';

import { MenuItem, RootLayout, SectionTitle, TinyButton } from '@components';
import { useAppDispatch } from '@redux/hooks';
import { logoutMe } from '@redux/state/auth/thunks';
import type { IconType, ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';

import Profile from './Profile/Profile';

import styles from './style';

interface Props extends ScreenProps<ScreenNames.SETTINGS_TAB> {}

const SettingsScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();

  const handleLogout = () => dispatch(logoutMe());

  const menuItems: { title: string; icon: IconType; onPress?(): void }[] = [
    { title: 'Categories', icon: 'other', onPress: () => navigation.navigate(ScreenNames.CATEGORIES_SCREEN) },
    { title: 'Limitations', icon: 'limit' },
    { title: 'Members', icon: 'users', onPress: () => navigation.navigate(ScreenNames.MEMBERS_SCREEN) },
  ];

  return (
    <RootLayout style={styles.root}>
      <SectionTitle title="Your Profile" button={<TinyButton title="Log out" icon="logout" onPress={handleLogout} />} />

      <Profile />

      <View style={styles.menu}>
        {menuItems.map(({ title, icon, onPress }) => (
          <MenuItem key={title} title={title} icon={icon} onPress={onPress} />
        ))}
      </View>
    </RootLayout>
  );
};

export default SettingsScreen;
