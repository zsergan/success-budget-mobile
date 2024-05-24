import { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, Easing } from 'react-native';

import styles from './style';

const LoadingScreen = () => {
  const screenWidth = Dimensions.get('window').width;
  const translateXSuccess = useRef(new Animated.Value(-screenWidth)).current;
  const translateXBudget = useRef(new Animated.Value(screenWidth)).current;

  useEffect(() => {
    Animated.timing(translateXSuccess, {
      toValue: 0,
      duration: 1500,
      easing: Easing.bounce,
      useNativeDriver: true,
    }).start();

    Animated.timing(translateXBudget, {
      toValue: 0,
      duration: 1500,
      easing: Easing.bounce,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.text, { transform: [{ translateX: translateXSuccess }] }]}>Success</Animated.Text>

      <Animated.Text style={[styles.text, { transform: [{ translateX: translateXBudget }] }]}>Budget</Animated.Text>
    </View>
  );
};

export default LoadingScreen;
