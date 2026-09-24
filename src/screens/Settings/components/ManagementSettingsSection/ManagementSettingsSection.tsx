import type { MainTabNavigationProp } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import SettingsRow from '../SettingsRow/SettingsRow';
import SettingsSection from '../SettingsSection/SettingsSection';

interface Props {
  navigation: MainTabNavigationProp<ScreenNames.SETTINGS_TAB>;
  categoriesLabel: string;
  walletsLabel: string;
}

const ManagementSettingsSection = ({ navigation, categoriesLabel, walletsLabel }: Props) => (
  <SettingsSection label="Management">
    <SettingsRow
      icon="other"
      label="Categories"
      sub={categoriesLabel}
      onPress={() => navigation.navigate(ScreenNames.CATEGORIES_SCREEN)}
    />

    <SettingsRow icon="wallet" label="Wallets" sub={walletsLabel} chevron={false} />
  </SettingsSection>
);

export default ManagementSettingsSection;
