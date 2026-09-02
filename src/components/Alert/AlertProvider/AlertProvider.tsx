import type { MutableRefObject, ReactNode } from 'react';
import { useCallback, useEffect, useState, createContext, useRef } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';

import type { AlertItem } from '../Alert/Alert';
import Alert from '../Alert/Alert';
import { registerGlobalAlertHandler } from './globalAlert';

import styles from './style';

interface AlertContextData {
  addAlert(message: string): void;
  dismissAlert(id: number): void;
}

export const AlertContext = createContext<AlertContextData>({} as AlertContextData);

interface AlertProviderProps {
  children: ReactNode;
}

const AlertProvider = ({ children }: AlertProviderProps) => {
  const screenHeight = Dimensions.get('window').height;
  const translateY = useRef(new Animated.Value(screenHeight / 4)).current;
  const timeout: MutableRefObject<NodeJS.Timeout | null> = useRef(null);

  const [alert, setAlert] = useState<AlertItem | undefined>(undefined);

  const showAlert = useCallback(
    () =>
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start(),
    [translateY],
  );

  const hideAlert = useCallback(
    () =>
      Animated.timing(translateY, {
        toValue: screenHeight / 4,
        duration: 300,
        easing: Easing.cubic,
        useNativeDriver: true,
      }).start(() => setAlert(undefined)),
    [screenHeight, translateY],
  );

  const addAlert = useCallback(
    (message: string) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      const id = Math.floor(Math.random() * 9000000) + 1000000;

      setAlert({ id, message });

      showAlert();

      timeout.current = setTimeout(() => {
        hideAlert();
      }, 5000);

      return id;
    },
    [showAlert, hideAlert],
  );

  const dismissAlert = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      hideAlert();
    }
  }, [hideAlert]);

  useEffect(() => {
    registerGlobalAlertHandler(addAlert);

    return () => registerGlobalAlertHandler(null);
  }, [addAlert]);

  return (
    <AlertContext.Provider value={{ addAlert, dismissAlert }}>
      <Animated.View style={[styles.provider, { transform: [{ translateY }] }]}>
        {alert && <Alert alertItem={alert} dismissAlert={dismissAlert} />}
      </Animated.View>

      {children}
    </AlertContext.Provider>
  );
};

export default AlertProvider;
