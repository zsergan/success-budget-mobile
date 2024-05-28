import { Text, TouchableOpacity, View } from 'react-native';

import { WalletCard, WalletModal, BottomModal, TinyWallet, Carousel } from '@components';
import type { WalletDesign } from '@shared/enums';
import type { NavigationType } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import useWalletsData from './useWalletsData';

import styles from './style';

const renderBottomModalContent = (walletName: string, currencyCode: string, design?: WalletDesign) => (
  <View style={styles.confirmContainer}>
    <TinyWallet walletName={walletName} currencyCode={currencyCode} design={design} />

    <Text style={styles.confirmText}>{`Delete a ${walletName} permanently?`}</Text>
  </View>
);

interface Props {
  navigation: NavigationType<ScreenNames.HOME_TAB>;
}

const Wallets = ({ navigation }: Props) => {
  const {
    wallets,
    selectedWallet,
    isModalVisible,
    isConfirmVisible,
    onWalletLongPress,
    onDeletePress,
    onDeleteCancel,
    onConfirm,
    onConfirmCancel,
  } = useWalletsData();

  return (
    <>
      <WalletModal
        isVisible={isModalVisible}
        onClose={onDeleteCancel}
        onEdit={() => {
          if (selectedWallet) {
            navigation.navigate(ScreenNames.ADD_WALLET_SCREEN, {
              id: selectedWallet.wallet.id,
              walletName: selectedWallet.wallet.wallet_name,
              balance: selectedWallet.wallet.balance,
              currencyId: selectedWallet.wallet.currency.id,
              design: selectedWallet.wallet.design,
            });
          }

          onDeleteCancel();
        }}
        onDelete={onDeletePress}
        walletName={selectedWallet?.wallet.wallet_name || ''}
        balance={selectedWallet?.wallet.balance || ''}
        currencyCode={selectedWallet?.wallet.currency.code || ''}
        totalIncome={selectedWallet?.totalIncome || 0}
        totalSpend={selectedWallet?.totalSpend || 0}
        design={selectedWallet?.wallet.design}
      />

      <BottomModal
        isVisible={isConfirmVisible}
        onClose={onConfirmCancel}
        content={renderBottomModalContent(
          selectedWallet?.wallet.wallet_name || '',
          selectedWallet?.wallet.currency.code || '',
          selectedWallet?.wallet.design,
        )}
        actions={[{ title: 'Delete', onPress: onConfirm }]}
      />

      <Carousel
        itemsLength={wallets.length}
        items={wallets}
        itemScale={0.88}
        renderItem={(item, walletWidth) => (
          <TouchableOpacity key={item?.wallet.id} onLongPress={() => onWalletLongPress(item)} activeOpacity={0.7}>
            <WalletCard
              style={{ width: walletWidth }}
              walletName={item?.wallet.wallet_name}
              balance={item?.wallet.balance}
              currencyCode={item?.wallet.currency.code}
              totalIncome={item.totalIncome}
              totalSpend={item.totalSpend}
              design={item?.wallet.design}
            />
          </TouchableOpacity>
        )}
      />
    </>
  );
};

export default Wallets;
