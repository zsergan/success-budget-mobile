import { useState } from 'react';
import { View } from 'react-native';

import { RootLayout, SectionTitle } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { logoutMe } from '@redux/state/auth/thunks';
import { selectCategory } from '@redux/state/category/selectors';
import { selectTotalBalance } from '@redux/state/wallet/selectors';
import { selectCurrentSpace } from '@redux/state/space/selectors';
import { useAlert, useThemePreference } from '@hooks';
import type { MainTabScreenProps } from '@shared/types';
import type { ScreenNames } from '@shared/enums';

import DeleteAccountDialog from './components/DeleteAccountDialog/DeleteAccountDialog';
import Profile from './components/Profile/Profile';
import SettingsRow from './components/SettingsRow/SettingsRow';
import SettingsSection from './components/SettingsSection/SettingsSection';
import ThemeRow from './components/ThemeRow/ThemeRow';
import SpaceSettingsSection from './components/SpaceSettingsSection/SpaceSettingsSection';
import ManagementSettingsSection from './components/ManagementSettingsSection/ManagementSettingsSection';
import AccountSettingsSection from './components/AccountSettingsSection/AccountSettingsSection';
import LogoutDialog from './components/LogoutDialog/LogoutDialog';

import styles from './style';

interface Props extends MainTabScreenProps<ScreenNames.SETTINGS_TAB> {}

const SettingsScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const { addAlert } = useAlert();
  const { preference, setThemePreference } = useThemePreference();

  const currentSpace = useAppSelector(selectCurrentSpace);
  const { incomes, expenses, archived } = useAppSelector(selectCategory);
  const { walletsCount } = useAppSelector(selectTotalBalance);

  const [isLogoutConfirmVisible, setIsLogoutConfirmVisible] = useState(false);
  const [isDeleteAccountVisible, setIsDeleteAccountVisible] = useState(false);

  const handleConfirmLogout = () => {
    setIsLogoutConfirmVisible(false);
    dispatch(logoutMe());
  };

  const showComingSoon = () => addAlert('Coming soon.');

  const categoriesLabel = `${incomes.length + expenses.length} active · ${archived.length} archived`;
  const walletsLabel = `${walletsCount} wallet${walletsCount === 1 ? '' : 's'} in this space`;

  return (
    <RootLayout style={styles.root} edges={['top', 'left', 'right']} scrollable>
      <SectionTitle title="Settings" />

      <View style={styles.scrollContent}>
        <Profile />

        <SettingsSection label="Appearance">
          <ThemeRow preference={preference} onChange={setThemePreference} />
        </SettingsSection>

        <SettingsSection label="Notifications">
          <SettingsRow icon="bell" label="Limit alerts" sub="Coming soon" inertToggle />
        </SettingsSection>

        <SpaceSettingsSection navigation={navigation} currentSpace={currentSpace} />

        <ManagementSettingsSection
          navigation={navigation}
          categoriesLabel={categoriesLabel}
          walletsLabel={walletsLabel}
        />

        <AccountSettingsSection
          navigation={navigation}
          onChangePasswordPress={showComingSoon}
          onLogoutPress={() => setIsLogoutConfirmVisible(true)}
          onDeleteAccountPress={() => setIsDeleteAccountVisible(true)}
        />
      </View>

      <LogoutDialog
        isVisible={isLogoutConfirmVisible}
        onClose={() => setIsLogoutConfirmVisible(false)}
        onConfirm={handleConfirmLogout}
      />

      <DeleteAccountDialog isVisible={isDeleteAccountVisible} onClose={() => setIsDeleteAccountVisible(false)} />
    </RootLayout>
  );
};

export default SettingsScreen;
