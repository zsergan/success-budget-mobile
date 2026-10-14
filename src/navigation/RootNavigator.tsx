import { useEffect, useState } from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';

import {
  AcceptInviteScreen,
  CategoriesScreen,
  CreateSpaceScreen,
  CreateWalletScreen,
  MembersScreen,
  SignInScreen,
  SignUpScreen,
  VerifyEmailScreen,
  LaunchScreen,
  WelcomeScreen,
} from '@screens';
import type { RootStackParamList } from '@shared/types';
import { usePendingWritesSync } from '@hooks';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectLaunch } from '@redux/state/launch/selectors';
import { runLaunch } from '@redux/state/launch/thunks';
import { ScreenNames } from '@shared/enums';
import { colors } from '@shared/theme';
import MainNavigator from './MainNavigator';
import useSessionData from './useSessionData';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Screens and transitions sit on the app's own background, the same as the launch screen's.
// The screens that open a launch phase (launch, Welcome, the app) replace the whole stack, so they fade in.
const phaseScreenOptions = { headerShown: false, animation: 'fade' } as const;

const navigationTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg } };

const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { phase, stage } = useAppSelector(selectLaunch);
  const [hasDrawn, setHasDrawn] = useState(false);
  useSessionData();
  usePendingWritesSync();

  useEffect(() => {
    dispatch(runLaunch());
  }, [dispatch]);

  const isReady = phase === 'ready';

  // The system launch screen stays up while the fonts load, so the first frame never swaps its typeface; once it is
  // gone the app keeps drawing, a repeated attempt included.
  if (!hasDrawn && phase === 'running' && stage === 'resources') return null;

  return (
    <GestureHandlerRootView
      onLayout={() => {
        setHasDrawn(true);
        SplashScreen.hideAsync();
      }}
    >
      <BottomSheetModalProvider>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator screenOptions={{ animation: isReady ? 'slide_from_right' : 'slide_from_left' }}>
            {isReady ? (
              <>
                <Stack.Screen name={ScreenNames.HOME_SCREEN} component={MainNavigator} options={phaseScreenOptions} />
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
            ) : phase === 'welcome' ? (
              <>
                <Stack.Screen
                  name={ScreenNames.WELCOME_SCREEN}
                  component={WelcomeScreen}
                  options={phaseScreenOptions}
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
            ) : (
              <Stack.Screen name={ScreenNames.LAUNCH_SCREEN} component={LaunchScreen} options={phaseScreenOptions} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default RootNavigator;
