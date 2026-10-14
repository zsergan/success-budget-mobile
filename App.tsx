import 'react-native-gesture-handler';
import RootNavigator from '@navigation/RootNavigator';
import { Provider } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AlertProvider, ErrorBoundary } from '@components';
import store from '@redux/Store';
import ChartsPrototypeScreen from '@screens/ChartsPrototype/ChartsPrototypeScreen';

const showChartsPrototype = __DEV__ && process.env.EXPO_PUBLIC_CHARTS_PROTOTYPE === '1';

// Hidden once the first screen is ready (RootNavigator) or on a crash (ErrorBoundary).
if (!showChartsPrototype) SplashScreen.preventAutoHideAsync();

const App = () => (
  <ErrorBoundary>
    <SafeAreaProvider>
      <Provider store={store}>
        <AlertProvider>{showChartsPrototype ? <ChartsPrototypeScreen /> : <RootNavigator />}</AlertProvider>
      </Provider>
    </SafeAreaProvider>
  </ErrorBoundary>
);

export default App;
