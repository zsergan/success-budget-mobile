import 'react-native-gesture-handler';
import RootNavigator from '@navigation/RootNavigator';
import { Provider } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary, ThemeProvider, ToastProvider } from '@components';
import store from '@redux/Store';

// Hidden once the first screen is ready (RootNavigator) or on a crash (ErrorBoundary).
SplashScreen.preventAutoHideAsync();

// The theme sits above everything, the crash screen included, and outlives sessions and spaces.
const App = () => (
  <ThemeProvider>
    <ErrorBoundary>
      <SafeAreaProvider>
        <Provider store={store}>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  </ThemeProvider>
);

export default App;
