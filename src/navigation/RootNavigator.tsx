import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CreateWalletScreen, LoginScreen, LoadingScreen } from '@screens';
import { useAuth, useLoadInitData } from '@hooks';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isSignedIn, isLoading } = useAuth();
  const { isLoading: isDataLoading } = useLoadInitData({ isSignedIn });

  const isAppLoading = isLoading || isDataLoading;

  return (
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              animation: isSignedIn ? 'slide_from_right' : 'slide_from_left',
            }}
          >
            {isAppLoading && <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />}

            {!isAppLoading && isSignedIn ? (
              <>
                <Stack.Screen name="Home screen" component={MainNavigator} options={{ headerShown: false }} />
                <Stack.Screen name="New wallet" component={CreateWalletScreen} />
              </>
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default RootNavigator;
