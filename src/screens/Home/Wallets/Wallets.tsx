import { Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { WalletCard, LongPressedModal, BottomModal, TinyWallet, Carousel } from '@components';
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
  onScrollEnd: (index: number) => void;
}

const Wallets = ({ navigation, onScrollEnd }: Props) => {
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
      <LongPressedModal
        longPressedItemStyle={styles.longPressedItem}
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
        longPressedItem={
          selectedWallet ? (
            <WalletCard
              walletName={selectedWallet.wallet.wallet_name}
              balance={selectedWallet.wallet.balance}
              currencyCode={selectedWallet.wallet.currency.code}
              totalIncome={selectedWallet.total_income}
              totalSpend={selectedWallet.total_spend}
              design={selectedWallet.wallet.design}
            />
          ) : (
            <></>
          )
        }
        onDelete={onDeletePress}
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
        onScrollEnd={onScrollEnd}
        renderItem={(item, walletWidth) => (
          <TouchableOpacity
            key={item?.wallet.id}
            onLongPress={() => Haptics.impactAsync().then(() => onWalletLongPress(item))}
            activeOpacity={0.7}
          >
            <WalletCard
              style={{ width: walletWidth }}
              walletName={item?.wallet.wallet_name}
              balance={item?.wallet.balance}
              currencyCode={item?.wallet.currency.code}
              totalIncome={item.total_income}
              totalSpend={item.total_spend}
              design={item?.wallet.design}
            />
          </TouchableOpacity>
        )}
      />
    </>
  );
};

export default Wallets;
