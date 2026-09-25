import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';

import Button from '@components/Buttons/Button/Button';
import Divider from '@components/Divider/Divider';
import ModalContainer from '../ModalContainer/ModalContainer';

import styles from './style';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  content: ReactNode;
  actions?: { title: string; onPress: () => void; disabled?: boolean }[];
  // Disables every action and blocks dismissal (backdrop, Android back, Cancel) while a request is in flight.
  disabled?: boolean;
}

const BottomModal = ({ isVisible, onClose, content, actions, disabled }: Props) => {
  const handleClose = disabled ? () => {} : onClose;

  return (
    <ModalContainer isVisible={isVisible} animationType="fade" onClose={handleClose}>
      <View style={styles.container}>
        <TouchableWithoutFeedback>
          <View style={styles.contentContainer}>
            <View style={styles.content}>{content}</View>

            {actions?.map(({ title, onPress, disabled: actionDisabled }) => (
              <Fragment key={title}>
                <Divider style={styles.divider} />

                <Button
                  title={title}
                  variant="tertiary"
                  onPress={onPress}
                  disabled={disabled || actionDisabled}
                  style={styles.action}
                />
              </Fragment>
            ))}
          </View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback>
          <Button title="Cancel" onPress={handleClose} disabled={disabled} style={styles.cancel} />
        </TouchableWithoutFeedback>
      </View>
    </ModalContainer>
  );
};

export default BottomModal;
