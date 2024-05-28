import { RootLayout, SectionTitle, TinyButton } from '@components';
import { useAppDispatch } from '@redux/hooks';
import { logoutMe } from '@redux/state/auth/thunks';

import Profile from './Profile';

import styles from './style';

const SettingsScreen = () => {
  const dispatch = useAppDispatch();

  const handleLogout = () => dispatch(logoutMe());

  return (
    <RootLayout style={styles.root}>
      <SectionTitle title="Your Profile" button={<TinyButton title="Log out" icon="logout" onPress={handleLogout} />} />

      <Profile />
    </RootLayout>
  );
};

export default SettingsScreen;
