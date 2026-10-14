import 'react-native-gesture-handler';
import RootNavigator from '@navigation/RootNavigator';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { AlertProvider, ErrorBoundary } from '@components';
import store from '@redux/Store';
import ChartsPrototypeScreen from '@screens/ChartsPrototype/ChartsPrototypeScreen';

const showChartsPrototype = __DEV__ && process.env.EXPO_PUBLIC_CHARTS_PROTOTYPE === '1';

const App = () => {
  const [fontsLoaded, fontError] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });
  // A font that failed to load falls back to the system font rather than holding the launch.
  const resourcesReady = fontsLoaded || fontError !== null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <Provider store={store}>
          <AlertProvider>
            {showChartsPrototype ? <ChartsPrototypeScreen /> : <RootNavigator resourcesReady={resourcesReady} />}
          </AlertProvider>
        </Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;
