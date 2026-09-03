import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { WalletCard, LongPressedModal, BottomModal, TinyWallet, Carousel, EmptyState } from '@components';
import type { WalletDesign } from '@shared/enums';
import type { NavigationType } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { colors } from '@shared/theme';
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
  const [activeIndex, setActiveIndex] = useState(0);

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

  const handleScrollEnd = (index: number) => {
    setActiveIndex(index);
    onScrollEnd(index);
  };

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
          walletName={wallets[0].wallet.wallet_name}
          balance={wallets[0].wallet.balance}
          currencyCode={wallets[0].wallet.currency.code}
          totalIncome={wallets[0].total_income}
          totalSpend={wallets[0].total_spend}
          design={wallets[0].wallet.design}
          onMorePress={() => onWalletLongPress(wallets[0])}
        />
      )}

      {wallets.length > 1 && (
        <View>
          <View style={styles.carouselContainer}>
            <Carousel
              itemsLength={wallets.length}
              items={wallets}
              itemScale={0.88}
              onScrollEnd={handleScrollEnd}
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
                    onMorePress={() => onWalletLongPress(item)}
                  />
                </TouchableOpacity>
              )}
            />

            <LinearGradient
              style={styles.fadeLeft}
              colors={[colors.bg, `${colors.bg}00`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              pointerEvents="none"
            />

            <LinearGradient
              style={styles.fadeRight}
              colors={[`${colors.bg}00`, colors.bg]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              pointerEvents="none"
            />
          </View>

          <View style={styles.dots}>
            {wallets.map((item, index) => (
              <View key={item.wallet.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>
        </View>
      )}
    </>
  );
};

export default Wallets;
