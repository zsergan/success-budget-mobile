import 'react-native-gesture-handler';
import RootNavigator from '@navigation/RootNavigator';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';

import { AlertProvider, ErrorBoundary } from '@components';
import store from '@redux/Store';

const App = () => {
  useFonts({
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
  });

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AlertProvider>
          <RootNavigator />
        </AlertProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
