import type { NavigationType } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import SettingsRow from '../SettingsRow/SettingsRow';
import SettingsSection from '../SettingsSection/SettingsSection';

interface Props {
  navigation: NavigationType<ScreenNames.SETTINGS_TAB>;
  onChangePasswordPress: () => void;
  onLogoutPress: () => void;
  onDeleteAccountPress: () => void;
}

const AccountSettingsSection = ({ navigation, onChangePasswordPress, onLogoutPress, onDeleteAccountPress }: Props) => (
  <SettingsSection label="Account">
    <SettingsRow
      icon="mail"
      label="Join a space"
      sub="Enter a code someone shared with you"
      onPress={() => navigation.navigate(ScreenNames.ACCEPT_INVITE_SCREEN)}
    />

    <SettingsRow icon="lock" label="Change password" onPress={onChangePasswordPress} />

    <SettingsRow icon="logout" label="Log out" onPress={onLogoutPress} />

    <SettingsRow
      icon="trash"
      label="Delete account"
      sub="Permanent, along with all your data"
      danger
      onPress={onDeleteAccountPress}
    />
  </SettingsSection>
);

export default AccountSettingsSection;
