import { useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  onExpense: () => void;
  onIncome: () => void;
}

const Fab = ({ onExpense, onIncome }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const nextIsOpen = !isOpen;

    setIsOpen(nextIsOpen);
    Animated.timing(rotation, {
      toValue: nextIsOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = (action: () => void) => {
    setIsOpen(false);
    rotation.setValue(0);
    action();
  };

  return (
    <View style={styles.root}>
      {isOpen && (
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handlePress(onIncome)} activeOpacity={0.7}>
            <Icon name="income" size={16} color={colors.ok} strokeWidth={2.1} />

            <Text style={styles.menuItemText}>Income</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handlePress(onExpense)} activeOpacity={0.7}>
            <Icon name="expense" size={16} color={colors.danger} strokeWidth={2.1} />

            <Text style={styles.menuItemText}>Expense</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={toggle} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.fab,
            {
              transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }],
            },
          ]}
        >
          <Icon name="plus" size={24} color={colors.onAccent} strokeWidth={2.4} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default Fab;
