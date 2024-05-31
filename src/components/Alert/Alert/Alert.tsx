import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, Dimensions, Easing, TouchableOpacity } from 'react-native';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import CircleIcon from '../../CircleIcon/CircleIcon';
import { palette } from '@shared/theme';

import styles from './style';

export type AlertType = 'error' | 'success' | 'warning' | 'info';

export interface AlertItem {
  id: number;
  type: AlertType;
  message: string;
  onDismiss?(alertHeight?: number): void;
}

interface Props {
  alertItem: AlertItem;
  dismissAlert?(id: number): void;
  style?: StyleProp<ViewStyle>;
}

const Alert = ({ alertItem: { id, type, message, onDismiss }, dismissAlert, style }: Props) => {
  const containerHeight: MutableRefObject<number> = useRef(0);
  const screenWidth = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(screenWidth)).current;
  const timeout: MutableRefObject<NodeJS.Timeout | null> = useRef(null);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      easing: Easing.cubic,
      useNativeDriver: true,
    }).start();

    if (onDismiss) {
      timeout.current = setTimeout(() => {
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 300,
          easing: Easing.cubic,
          useNativeDriver: true,
        }).start(() => {
          onDismiss(containerHeight.current);
        });
      }, 5000);
    }
  }, [onDismiss, screenWidth, translateX]);

  const dismiss = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    dismissAlert?.(id);
  };

  return (
    <Animated.View
      onLayout={(event) => (containerHeight.current = event.nativeEvent.layout.height)}
      style={[styles.root, styles[type], style, { transform: [{ translateX }] }]}
    >
      <View style={styles.background} />

      <View style={styles.container}>
        <View style={styles.textContainer}>
          <MaterialIcons name="error" size={32} color={palette.red} />

          <Text style={styles.text}>{message}</Text>
        </View>

        {dismissAlert && (
          <TouchableOpacity onPress={dismiss} activeOpacity={0.5}>
            <CircleIcon icon="close" size="md" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export default Alert;
