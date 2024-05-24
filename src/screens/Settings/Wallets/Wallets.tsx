import { View, Text } from 'react-native';
import { Fontisto } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

import { Card, ConfirmModal, SwipeOptions } from '@components';
import { formatNumber } from '@shared/utils';
import { useSwipe } from '@hooks';
import useWalletsData from './useWalletsData';

import styles from './style';

const Wallets = () => {
  const { swipeRef, onBegan } = useSwipe();
  const { wallets, isModalVisible, onDeletePres, onDeleteCancel, onDeleteConfirm } = useWalletsData();

  const renderRightActions = (walletId: number) => (
    <SwipeOptions style={styles.swipe} onDelete={() => onDeletePres(walletId)} />
  );

  return (
    <View style={styles.root}>
      <ConfirmModal isVisible={isModalVisible} onConfirm={onDeleteConfirm} onCancel={onDeleteCancel} />

      {wallets.map((wallet, index) => (
        <Swipeable
          key={wallet.wallet.id}
          ref={(ref) => swipeRef(ref, index)}
          renderRightActions={() => renderRightActions(wallet.wallet.id)}
          onBegan={() => onBegan(index)}
          childrenContainerStyle={styles.swipeChildrenContainer}
        >
          <Card style={styles.card}>
            <View>
              <Text style={styles.name}>{wallet.wallet.wallet_name}</Text>

              <Text style={styles.amount}>
                {`${formatNumber(wallet.wallet.balance)} ${wallet.wallet.currency.code}`}
              </Text>
            </View>

            <Fontisto name="wallet" size={36} color="black" />
          </Card>
        </Swipeable>
      ))}
    </View>
  );
};

export default Wallets;
