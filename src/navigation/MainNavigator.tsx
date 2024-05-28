import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Entypo, FontAwesome6, Ionicons } from '@expo/vector-icons';

import { HomeScreen, SettingsScreen, TransactionsScreen } from '@screens';
import { palette } from '@shared/theme';
import { ScreenNames } from '@shared/enums';

const Tab = createBottomTabNavigator();

interface IconProps {
  color: string;
  size: number;
}

const HomeIcon = ({ color, size }: IconProps) => <Entypo name="home" size={size} color={color} />;
const TransactionsIcon = ({ color, size }: IconProps) => (
  <FontAwesome6 name="money-bill-transfer" size={size} color={color} />
);
const SettingsIcon = ({ color, size }: IconProps) => <Ionicons name="settings-sharp" size={size} color={color} />;

const MainNavigator = () => {
  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: palette.greyLight }}
      screenOptions={{
        tabBarStyle: { backgroundColor: palette.greyLight },
        tabBarActiveTintColor: palette.black,
        tabBarInactiveTintColor: palette.greyDark,
      }}
    >
      <Tab.Screen
        name={ScreenNames.HOME_TAB}
        component={HomeScreen}
        options={{ tabBarIcon: HomeIcon, headerShown: false }}
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
