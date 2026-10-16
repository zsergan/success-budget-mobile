import { useEffect, useMemo, useState } from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';

import {
  AcceptInviteScreen,
  CategoriesScreen,
  CreateSpaceScreen,
  CreateWalletScreen,
  ForgotPasswordScreen,
  MembersScreen,
  NewPasswordScreen,
  ResetCodeScreen,
  SignInScreen,
  SignUpScreen,
  VerifyEmailScreen,
  LaunchScreen,
  WelcomeScreen,
} from '@screens';
import type { RootStackParamList } from '@shared/types';
import { usePendingWritesSync, useTheme } from '@hooks';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectLaunch } from '@redux/state/launch/selectors';
import { runLaunch } from '@redux/state/launch/thunks';
import { ScreenNames } from '@shared/enums';
import MainNavigator from './MainNavigator';
import useSessionData from './useSessionData';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Screens and transitions sit on the app's own background, the same as the launch screen's.
// The screens that open a launch phase (launch, Welcome, the app) replace the whole stack, so they fade in.
const phaseScreenOptions = { headerShown: false, animation: 'fade' } as const;

const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { phase, stage } = useAppSelector(selectLaunch);
  const isSignedIn = useAppSelector((state) => state.auth.isSignedIn);
  const { isReady: isThemeReady, scheme, colorTheme } = useTheme();
  const [hasDrawn, setHasDrawn] = useState(false);
  useSessionData();
  usePendingWritesSync();

  useEffect(() => {
    dispatch(runLaunch());
  }, [dispatch]);

  // A sign-in from Welcome loads the session's required data the same way a cold start does.
  useEffect(() => {
    if (isSignedIn && phase === 'welcome') dispatch(runLaunch());
  }, [dispatch, isSignedIn, phase]);

  const isReady = phase === 'ready';

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

    return { ...base, colors: { ...base.colors, background: colorTheme.colors.bg } };
  }, [scheme, colorTheme]);

  // The system launch screen stays up while the fonts and the theme preference load, so the first frame never swaps
  // its typeface or colors; once it is gone the app keeps drawing, a repeated attempt included.
  if (!hasDrawn && (!isThemeReady || (phase === 'running' && stage === 'resources'))) return null;

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
                <Stack.Screen
                  name={ScreenNames.FORGOT_PASSWORD_SCREEN}
                  component={ForgotPasswordScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name={ScreenNames.RESET_CODE_SCREEN}
                  component={ResetCodeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name={ScreenNames.NEW_PASSWORD_SCREEN}
                  component={NewPasswordScreen}
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
