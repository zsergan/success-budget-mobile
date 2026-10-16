import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';

import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  children: ReactNode;
  backgroundStyle?: 'blur' | 'dark';
  animationType?: 'fade' | 'slide' | 'none';
}

const ModalContainer = ({ isVisible, onClose, children, backgroundStyle = 'dark', animationType }: Props) => {
  const { scheme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={isVisible} transparent animationType={animationType} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={[styles.absolute, styles.pressable]}>
        {backgroundStyle === 'blur' && (
          <BlurView intensity={40} tint={scheme === 'dark' ? 'dark' : 'default'} style={styles.absolute} />
        )}
        {backgroundStyle === 'dark' && <View style={[styles.absolute, styles.dark]} />}

        {children}
      </Pressable>
    </Modal>
  );
};

export default ModalContainer;
