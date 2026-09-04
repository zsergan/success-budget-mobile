import 'react-native-gesture-handler';
import RootNavigator from '@navigation/RootNavigator';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { AlertProvider, ErrorBoundary } from '@components';
import store from '@redux/Store';

const App = () => {
  useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
  });

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <Provider store={store}>
          <AlertProvider>
            <RootNavigator />
          </AlertProvider>
        </Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;
