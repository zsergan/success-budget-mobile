import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';

import styles from './style';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  children: ReactNode;
  backgroundStyle?: 'blur' | 'dark';
  animationType?: 'fade' | 'slide' | 'none';
}

const ModalContainer = ({ isVisible, onClose, children, backgroundStyle = 'dark', animationType }: Props) => (
  <Modal visible={isVisible} transparent animationType={animationType} onRequestClose={onClose}>
    <Pressable onPress={onClose} style={[styles.absolute, styles.pressable]}>
      {backgroundStyle === 'blur' && <BlurView intensity={40} style={styles.absolute} />}
      {backgroundStyle === 'dark' && <View style={[styles.absolute, styles.dark]} />}

      {children}
    </Pressable>
  </Modal>
);

export default ModalContainer;
