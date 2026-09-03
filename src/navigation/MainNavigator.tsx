import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen, LimitsScreen, SettingsScreen, TransactionsScreen } from '@screens';
import { Icon } from '@components';
import { colors } from '@shared/theme';
import { ScreenNames } from '@shared/enums';
import type { RootStackParamList } from '@shared/types';

const Tab = createBottomTabNavigator<RootStackParamList>();

interface IconProps {
  color: string;
  size: number;
}

const HomeIcon = ({ color, size }: IconProps) => <Icon name="home" size={size} color={color} />;
const LimitsIcon = ({ color, size }: IconProps) => <Icon name="limit" size={size} color={color} />;
const TransactionsIcon = ({ color, size }: IconProps) => <Icon name="list" size={size} color={color} />;
const SettingsIcon = ({ color, size }: IconProps) => <Icon name="settings" size={size} color={color} />;

const MainNavigator = () => {
  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: colors.bg }}
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen
        name={ScreenNames.HOME_TAB}
        component={HomeScreen}
        options={{ tabBarIcon: HomeIcon, headerShown: false }}
      />

      <Tab.Screen
        name={ScreenNames.LIMITS_TAB}
        component={LimitsScreen}
        options={{ tabBarIcon: LimitsIcon, headerShown: false }}
      />

      <Tab.Screen
        name={ScreenNames.TRANSACTIONS_TAB}
        component={TransactionsScreen}
        options={{ tabBarIcon: TransactionsIcon, headerShown: false }}
      />

      <Tab.Screen
        name={ScreenNames.SETTINGS_TAB}
        component={SettingsScreen}
        options={{ tabBarIcon: SettingsIcon, headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
