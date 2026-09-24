import type { Space } from '@api/dto';
import type { MainTabNavigationProp } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import SettingsRow from '../SettingsRow/SettingsRow';
import SettingsSection from '../SettingsSection/SettingsSection';

interface Props {
  navigation: MainTabNavigationProp<ScreenNames.SETTINGS_TAB>;
  currentSpace?: Space;
}

const SpaceSettingsSection = ({ navigation, currentSpace }: Props) => {
  const isOwner = currentSpace?.role === 'owner';
  const memberLabel = currentSpace
    ? `${currentSpace.member_count} ${currentSpace.member_count === 1 ? 'person' : 'people'}${isOwner ? ' · you are the owner' : ''}`
    : undefined;

  return (
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
  );
};

export default SpaceSettingsSection;
