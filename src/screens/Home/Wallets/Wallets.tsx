import { Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { WalletCardProps } from '@components';
import { WalletCard, LongPressedModal, BottomModal, TinyWallet, Carousel, EmptyState } from '@components';
import type { GetWalletsResponse } from '@api/dto';
import type { AppColor } from '@shared/enums';
import type { NavigationType } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import useWalletsData from './useWalletsData';

import styles from './style';

const renderBottomModalContent = (walletName: string, currencyCode: string, design?: AppColor) => (
  <View style={styles.confirmContainer}>
    <TinyWallet walletName={walletName} currencyCode={currencyCode} design={design} />

    <Text style={styles.confirmText}>{`Delete a ${walletName} permanently?`}</Text>
  </View>
);

const toWalletCardProps = (
  item: GetWalletsResponse,
  currencyCode: string,
): Omit<WalletCardProps, 'onMorePress' | 'style'> => ({
  walletName: item.wallet.wallet_name,
  balance: item.wallet.balance,
  currencyCode,
  totalIncome: item.total_income,
  totalSpend: item.total_spend,
  design: item.wallet.design,
});

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

  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode) || '';

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
              design: selectedWallet.wallet.design,
            });
          }

          onDeleteCancel();
        }}
        longPressedItem={selectedWallet ? <WalletCard {...toWalletCardProps(selectedWallet, currencyCode)} /> : <></>}
        onDelete={onDeletePress}
      />

      <BottomModal
        isVisible={isConfirmVisible}
        onClose={onConfirmCancel}
        content={renderBottomModalContent(
          selectedWallet?.wallet.wallet_name || '',
          currencyCode,
          selectedWallet?.wallet.design,
        )}
        actions={[{ title: 'Delete', onPress: onConfirm }]}
      />

      {wallets.length === 0 && (
        <EmptyState
          icon="wallet"
          title="No wallets yet"
          description="Add your first wallet to start tracking income and expenses."
          actionLabel="Add first wallet"
          actionIcon="plus"
          onActionPress={() => navigation.navigate(ScreenNames.ADD_WALLET_SCREEN, { id: 'new' })}
        />
      )}

      {wallets.length === 1 && (
        <WalletCard
          {...toWalletCardProps(wallets[0], currencyCode)}
          onMorePress={() => onWalletLongPress(wallets[0])}
        />
      )}

      {wallets.length > 1 && (
        <Carousel
          items={wallets}
          keyExtractor={(item) => item.wallet.id}
          onIndexChange={onScrollEnd}
          renderItem={(item, walletWidth) => (
            <TouchableOpacity
              onLongPress={() => Haptics.impactAsync().then(() => onWalletLongPress(item))}
              activeOpacity={0.7}
            >
              <WalletCard
                {...toWalletCardProps(item, currencyCode)}
                style={{ width: walletWidth }}
                onMorePress={() => onWalletLongPress(item)}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </>
  );
};

export default Wallets;
