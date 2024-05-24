import { View, Modal, Text } from 'react-native';

import Button from '../Button/Button';

import styles from './style';

interface Props {
  isVisible: boolean;
  confirmText?: string;
  onConfirm: () => void;
  cancelText?: string;
  onCancel: () => void;
}

const ConfirmModal = ({ isVisible, confirmText = 'Confirm', onConfirm, cancelText = 'Cancel', onCancel }: Props) => {
  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.question}>Are you sure?</Text>

          <View style={styles.buttonsContainer}>
            <Button style={styles.button} title={confirmText} onPress={onConfirm} />

            <Button style={styles.button} title={cancelText} onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;
