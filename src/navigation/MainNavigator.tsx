import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Entypo, FontAwesome6, Ionicons } from '@expo/vector-icons';

import { HomeScreen, SettingsScreen, TransactionsScreen } from '@screens';

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
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: HomeIcon }} />

      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ tabBarIcon: TransactionsIcon }} />

      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: SettingsIcon }} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
