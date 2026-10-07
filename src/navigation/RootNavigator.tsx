import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  AcceptInviteScreen,
  CategoriesScreen,
  CreateSpaceScreen,
  CreateWalletScreen,
  MembersScreen,
  SignInScreen,
  SignUpScreen,
  VerifyEmailScreen,
  LoadingScreen,
  WelcomeScreen,
} from '@screens';
import type { RootStackParamList } from '@shared/types';
import { useAuth, useLoadInitData, usePendingWritesSync } from '@hooks';
import { ScreenNames } from '@shared/enums';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { isSignedIn, isLoading } = useAuth();
  const { isLoading: isDataLoading } = useLoadInitData({ isSignedIn });
  usePendingWritesSync();

  const isAppLoading = isLoading || isDataLoading;

  return (
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ animation: isSignedIn ? 'slide_from_right' : 'slide_from_left' }}>
            {isAppLoading && (
              <Stack.Screen
                name={ScreenNames.LOADING_SCREEN}
                component={LoadingScreen}
                options={{ headerShown: false }}
              />
            )}

            {!isAppLoading && isSignedIn ? (
              <>
                <Stack.Screen
                  name={ScreenNames.HOME_SCREEN}
                  component={MainNavigator}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name={ScreenNames.ADD_WALLET_SCREEN}
                  component={CreateWalletScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name={ScreenNames.CATEGORIES_SCREEN}
                  component={CategoriesScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name={ScreenNames.CREATE_SPACE_SCREEN}
                  component={CreateSpaceScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name={ScreenNames.MEMBERS_SCREEN}
                  component={MembersScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name={ScreenNames.ACCEPT_INVITE_SCREEN}
                  component={AcceptInviteScreen}
                  options={{ headerShown: false }}
                />
              </>
            ) : (
              <>
                <Stack.Screen
                  name={ScreenNames.WELCOME_SCREEN}
                  component={WelcomeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name={ScreenNames.SIGN_IN_SCREEN}
                  component={SignInScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name={ScreenNames.SIGN_UP_SCREEN}
                  component={SignUpScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name={ScreenNames.VERIFY_EMAIL_SCREEN}
                  component={VerifyEmailScreen}
                  options={{ headerShown: false }}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default RootNavigator;
