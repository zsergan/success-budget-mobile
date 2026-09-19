import { useState } from 'react';
import { Text, View } from 'react-native';

import { BottomModal, RootLayout, SectionTitle } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { logoutMe } from '@redux/state/auth/thunks';
import { selectCategory } from '@redux/state/category/selectors';
import { selectTotalBalance } from '@redux/state/wallet/selectors';
import { selectCurrentSpace } from '@redux/state/space/selectors';
import { useAlert, useThemePreference } from '@hooks';
import type { ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';

import DeleteAccountDialog from './DeleteAccountDialog/DeleteAccountDialog';
import Profile from './Profile/Profile';
import SettingsRow from './SettingsRow';
import SettingsSection from './SettingsSection';
import ThemeRow from './ThemeRow';

import styles from './style';

interface Props extends ScreenProps<ScreenNames.SETTINGS_TAB> {}

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

  const isOwner = currentSpace?.role === 'owner';
  const memberLabel = currentSpace
    ? `${currentSpace.member_count} ${currentSpace.member_count === 1 ? 'person' : 'people'}${isOwner ? ' · you are the owner' : ''}`
    : undefined;
  const categoriesLabel = `${incomes.length + expenses.length} active · ${archived.length} archived`;
  const walletsLabel = `${walletsCount} wallet${walletsCount === 1 ? '' : 's'} in this space`;

  return (
    <RootLayout style={styles.root} scrollable>
      <SectionTitle title="Settings" />

      <View style={styles.scrollContent}>
        <Profile />

        <SettingsSection label="Appearance">
          <ThemeRow preference={preference} onChange={setThemePreference} />
        </SettingsSection>

        <SettingsSection label="Notifications">
          <SettingsRow icon="bell" label="Limit alerts" sub="Coming soon" inertToggle />
        </SettingsSection>

        <SettingsSection label="Space">
          <SettingsRow
            icon="users"
            label="Members"
            sub={memberLabel}
            onPress={() => navigation.navigate(ScreenNames.MEMBERS_SCREEN)}
          />

          <SettingsRow
            icon="chart"
            label="Space currency"
            sub={currentSpace ? `Set when "${currentSpace.name}" was created` : undefined}
            value={currentSpace?.currency.code}
            chevron={false}
          />

          <SettingsRow
            icon="plus"
            label="Create new space"
            sub="Its own wallets, limits and currency"
            onPress={() => navigation.navigate(ScreenNames.CREATE_SPACE_SCREEN)}
          />
        </SettingsSection>

        <SettingsSection label="Management">
          <SettingsRow
            icon="other"
            label="Categories"
            sub={categoriesLabel}
            onPress={() => navigation.navigate(ScreenNames.CATEGORIES_SCREEN)}
          />

          <SettingsRow icon="wallet" label="Wallets" sub={walletsLabel} chevron={false} />
        </SettingsSection>

        <SettingsSection label="Account">
          <SettingsRow
            icon="mail"
            label="Join a space"
            sub="Enter a code someone shared with you"
            onPress={() => navigation.navigate(ScreenNames.ACCEPT_INVITE_SCREEN)}
          />

          <SettingsRow icon="lock" label="Change password" onPress={showComingSoon} />

          <SettingsRow icon="logout" label="Log out" onPress={() => setIsLogoutConfirmVisible(true)} />

          <SettingsRow
            icon="trash"
            label="Delete account"
            sub="Permanent, along with all your data"
            danger
            onPress={() => setIsDeleteAccountVisible(true)}
          />
        </SettingsSection>
      </View>

      <BottomModal
        isVisible={isLogoutConfirmVisible}
        onClose={() => setIsLogoutConfirmVisible(false)}
        content={
          <>
            <Text style={styles.confirmText}>Log out of your account?</Text>
            <Text style={styles.confirmSubtext}>
              Your data stays on the server. Sign back in with the same email and password.
            </Text>
          </>
        }
        actions={[{ title: 'Log out', onPress: handleConfirmLogout }]}
      />

      <DeleteAccountDialog isVisible={isDeleteAccountVisible} onClose={() => setIsDeleteAccountVisible(false)} />
    </RootLayout>
  );
};

export default SettingsScreen;
