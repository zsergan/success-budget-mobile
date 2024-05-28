import { TouchableWithoutFeedback, View } from 'react-native';

import type { WalletCardProps } from '../../Wallets/WalletCard/WalletCard';
import type { ModalOptionsProps } from '../ModalOptions/ModalOptions';
import ModalOptions from '../ModalOptions/ModalOptions';
import WalletCard from '../../Wallets/WalletCard/WalletCard';
import ModalContainer from '../ModalContainer/ModalContainer';

import styles from './style';

type Props = WalletCardProps &
  ModalOptionsProps & {
    isVisible: boolean;
    onClose: () => void;
  };

const WalletModal = ({ isVisible, onClose, onEdit, onDelete, ...walletProps }: Props) => (
  <ModalContainer isVisible={isVisible} onClose={onClose} backgroundStyle="blur" animationType="fade">
    <TouchableWithoutFeedback>
      <View style={styles.content}>
        <WalletCard {...walletProps} />
      </View>
    </TouchableWithoutFeedback>

    <TouchableWithoutFeedback>
      <ModalOptions onEdit={onEdit} onDelete={onDelete} />
    </TouchableWithoutFeedback>
  </ModalContainer>
);

export default WalletModal;
