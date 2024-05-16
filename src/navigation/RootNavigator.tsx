import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text } from 'react-native';

import { SettingsScreen, HomeScreen, LoginScreen, TransactionsScreen } from '@screens';
import { useAuth, useLoadInitData } from '@hooks';

const Tab = createBottomTabNavigator();

const RootNavigator = () => {
  const { isSignedIn, isLoading } = useAuth();
  const { isLoading: isDataLoading } = useLoadInitData({ isSignedIn });

  if (isLoading || isDataLoading) return <Text>Loading</Text>;

  return (
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <NavigationContainer>
          {isSignedIn ? (
            <Tab.Navigator>
              <Tab.Screen name="Home" component={HomeScreen} />
              <Tab.Screen name="Transactions" component={TransactionsScreen} />
              <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
          ) : (
            <LoginScreen />
          )}
        </NavigationContainer>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default RootNavigator;
