import type { ReactNode } from 'react';
import { useCallback, useState, createContext, useRef } from 'react';
import { Animated, Easing } from 'react-native';

import type { AlertItem, AlertType } from '../Alert/Alert';
import Alert from '../Alert/Alert';

import theme from '@shared/theme';
import styles from './style';

const DEFAULT_ONE_ROW_HEIGHT = 50;

interface AlertContextData {
  addAlert(message: string, type: 'error' | 'success' | 'warning' | 'info'): void;
  dismissAlert(id: number): void;
}

export const AlertContext = createContext<AlertContextData>({} as AlertContextData);

interface AlertProviderProps {
  children: ReactNode;
}

const AlertProvider = ({ children }: AlertProviderProps) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const translateY = useRef(new Animated.Value(0)).current;

  const addAlert = useCallback(
    (message: string, type: AlertType) => {
      const id = Math.floor(Math.random() * 9000000) + 1000000;

      const onDismiss = (alertHeight?: number) => {
        Animated.timing(translateY, {
          toValue: -((alertHeight ? alertHeight : DEFAULT_ONE_ROW_HEIGHT) + theme.spacing.xs),
          duration: 300,
          easing: Easing.cubic,
          useNativeDriver: true,
        }).start(() => {
          translateY.setValue(0);
          setAlerts((prev) => prev.filter((alert) => alert.id !== id));
        });
      };

      setAlerts((prev) => [...prev, { id, type, message, onDismiss }]);

      return id;
    },
    [translateY],
  );

  const dismissAlert = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  return (
    <AlertContext.Provider value={{ addAlert, dismissAlert }}>
      <Animated.View style={[styles.provider, { transform: [{ translateY }] }]}>
        {alerts.map((alert) => (
          <Alert key={alert.id} alertItem={alert} dismissAlert={dismissAlert} />
        ))}
      </Animated.View>

      {children}
    </AlertContext.Provider>
  );
};

export default AlertProvider;
