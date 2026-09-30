import { useEffect, useEffectEvent } from 'react';
import { AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Other members' changes reach this device only through a new request, so a return
// to the screen, or to the app while it shows this screen, asks for one.
const useRefreshOnReturn = (onReturn: () => void) => {
  const navigation = useNavigation();
  const handleReturn = useEffectEvent(onReturn);

  useEffect(() => {
    let wasInBackground = false;

    const unsubscribeFocus = navigation.addListener('focus', () => handleReturn());
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        wasInBackground = true;
      } else if (state === 'active' && wasInBackground) {
        wasInBackground = false;
        if (navigation.isFocused()) handleReturn();
      }
    });

    return () => {
      unsubscribeFocus();
      appState.remove();
    };
  }, [navigation]);
};

export default useRefreshOnReturn;
