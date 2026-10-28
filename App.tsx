import 'react-native-gesture-handler';
import RootNavigator from '@navigation/RootNavigator';
import { Provider } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AlertProvider, ErrorBoundary, ThemeProvider, ToastProvider } from '@components';
import store from '@redux/Store';
import ChartsPrototypeScreen from '@screens/ChartsPrototype/ChartsPrototypeScreen';

const showChartsPrototype = __DEV__ && process.env.EXPO_PUBLIC_CHARTS_PROTOTYPE === '1';

// Hidden once the first screen is ready (RootNavigator) or on a crash (ErrorBoundary).
if (!showChartsPrototype) SplashScreen.preventAutoHideAsync();

// The theme sits above everything, the crash screen included, and outlives sessions and spaces.
const App = () => (
  <ThemeProvider>
    <ErrorBoundary>
      <SafeAreaProvider>
        <Provider store={store}>
          <ToastProvider>
            <AlertProvider>{showChartsPrototype ? <ChartsPrototypeScreen /> : <RootNavigator />}</AlertProvider>
          </ToastProvider>
        </Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  </ThemeProvider>
);

export default App;
