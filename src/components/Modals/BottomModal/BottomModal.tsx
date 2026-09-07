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
  actions?: { title: string; onPress: () => void }[];
}

const BottomModal = ({ isVisible, onClose, content, actions }: Props) => (
  <ModalContainer isVisible={isVisible} animationType="fade" onClose={onClose}>
    <View style={styles.container}>
      <TouchableWithoutFeedback>
        <View style={styles.contentContainer}>
          <View style={styles.content}>{content}</View>

          {actions?.map(({ title, onPress }) => (
            <Fragment key={title}>
              <Divider style={styles.divider} />

              <Button title={title} variant="tertiary" onPress={onPress} style={styles.action} />
            </Fragment>
          ))}
        </View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback>
        <Button title="Cancel" onPress={onClose} style={styles.cancel} />
      </TouchableWithoutFeedback>
    </View>
  </ModalContainer>
);

export default BottomModal;
