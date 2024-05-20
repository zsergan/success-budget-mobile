import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { LoginScreen } from '@screens';
import { useAuth, useLoadInitData } from '@hooks';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isSignedIn, isLoading } = useAuth();
  const { isLoading: isDataLoading } = useLoadInitData({ isSignedIn });

  if (isLoading || isDataLoading) return <Text>Loading</Text>;

  return (
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              animation: isSignedIn ? 'slide_from_right' : 'slide_from_left',
            }}
          >
            {isSignedIn ? (
              <Stack.Screen name="MainNavigator" component={MainNavigator} options={{ headerShown: false }} />
            ) : (
              <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default RootNavigator;
