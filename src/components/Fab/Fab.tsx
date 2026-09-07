import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import Icon from '@components/Icon/Icon';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  onExpense: () => void;
  onIncome: () => void;
}

const Fab = ({ onExpense, onIncome }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const rotation = useSharedValue(0);
  const menuProgress = useSharedValue(0);

  const toggle = () => {
    const nextIsOpen = !isOpen;

    setIsOpen(nextIsOpen);
    rotation.value = withTiming(nextIsOpen ? 1 : 0, { duration: 180 });
    menuProgress.value = withTiming(nextIsOpen ? 1 : 0, { duration: nextIsOpen ? 180 : 120 });
  };

  const handlePress = (action: () => void) => {
    setIsOpen(false);
    rotation.value = 0;
    menuProgress.value = 0;
    action();
  };

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 45}deg` }],
  }));

  // Manually driven instead of Reanimated's layout animations, which measure this View poorly under a shrink-to-fit ancestor.
  const menuStyle = useAnimatedStyle(() => ({
    opacity: menuProgress.value,
    transform: [{ translateY: interpolate(menuProgress.value, [0, 1], [12, 0]) }],
  }));

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.menu, menuStyle]} pointerEvents={isOpen ? 'auto' : 'none'}>
        <TouchableOpacity style={styles.menuItem} onPress={() => handlePress(onIncome)} activeOpacity={0.7}>
          <Icon name="income" size={16} color={colors.ok} strokeWidth={2.1} />

          <Text style={styles.menuItemText}>Income</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => handlePress(onExpense)} activeOpacity={0.7}>
          <Icon name="expense" size={16} color={colors.danger} strokeWidth={2.1} />

          <Text style={styles.menuItemText}>Expense</Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity onPress={toggle} activeOpacity={0.8}>
        <Animated.View style={[styles.fab, iconStyle]}>
          <Icon name="plus" size={24} color={colors.onAccent} strokeWidth={2.4} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default Fab;
