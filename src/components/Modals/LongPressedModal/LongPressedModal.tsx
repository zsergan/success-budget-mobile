import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { TouchableWithoutFeedback, Animated } from 'react-native';

import type { ModalOptionsProps } from '../ModalOptions/ModalOptions';
import ModalOptions from '../ModalOptions/ModalOptions';
import ModalContainer from '../ModalContainer/ModalContainer';

import styles from './style';

type Props = ModalOptionsProps & {
  isVisible: boolean;
  longPressedItem: ReactNode;
  onClose: () => void;
  longPressedItemStyle?: StyleProp<ViewStyle>;
};

const LongPressedModal = ({ isVisible, longPressedItem, onClose, onEdit, onDelete, longPressedItemStyle }: Props) => {
  const containerScale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(opacity, {
        toValue: 1,
        mass: 0.1,
        useNativeDriver: true,
      }).start();

      Animated.spring(containerScale, {
        toValue: 1,
        mass: 0.1,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, containerScale, opacity]);

  const handleClose = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    Animated.timing(containerScale, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <ModalContainer isVisible={isVisible} onClose={handleClose} backgroundStyle="blur" animationType="fade">
      <TouchableWithoutFeedback>
        <Animated.View
          style={[styles.content, { transform: [{ scale: containerScale }], opacity }, longPressedItemStyle]}
        >
          {longPressedItem}
        </Animated.View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback>
        <Animated.View style={[styles.options, { transform: [{ scale: containerScale }], opacity }]}>
          <ModalOptions onEdit={onEdit} onDelete={onDelete} />
        </Animated.View>
      </TouchableWithoutFeedback>
    </ModalContainer>
  );
};

export default LongPressedModal;
