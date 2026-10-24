import { useMemo } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { WalletCardProps } from '@components';
import { Carousel, ConfirmationSheet, EmptyState, SectionTitle, TinyButton, WalletCard } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import type { GetWalletsResponse } from '@api/dto';
import type { MainTabNavigationProp } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import useWalletActions from './useWalletActions';
import WalletActionsSheet from './WalletActionsSheet/WalletActionsSheet';

import createStyles from './style';

const toWalletCardProps = (
  item: GetWalletsResponse,
  currencyCode: string,
): Omit<WalletCardProps, 'onMorePress' | 'style'> => ({
  walletName: item.wallet.wallet_name,
  balance: String(item.wallet.balance),
  currencyCode,
  totalIncome: item.total_income,
  totalSpend: item.total_spend,
  design: item.wallet.design,
});

interface Props {
  navigation: MainTabNavigationProp<ScreenNames.HOME_TAB>;
  /** The wallet the carousel is currently resting on — seeds the transaction form's default wallet. */
  onFocusedWalletChange: (walletId: number) => void;
}

const WalletsSection = ({ navigation, onFocusedWalletChange }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const {
    wallets,
    isLoading,
    hasError,
    retry,
    menuWallet,
    openMenu,
    closeMenu,
    onEditPress,
    onDeletePress,
    onMenuDismissed,
    walletToDelete,
    isDeleting,
    deleteError,
    onConfirm,
    onConfirmCancel,
  } = useWalletActions({
    onEdit: ({ wallet }) =>
      navigation.navigate(ScreenNames.ADD_WALLET_SCREEN, {
        id: wallet.id,
        walletName: wallet.wallet_name,
        balance: String(wallet.balance),
        design: wallet.design,
      }),
  });

  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode) || '';
  const menuCard = useMemo(() => menuWallet && toWalletCardProps(menuWallet, currencyCode), [menuWallet, currencyCode]);

  return (
    <>
      <SectionTitle
        style={styles.title}
        title="Your wallets"
        button={
          <TinyButton
            title="Add Wallet"
            icon="plus"
            iconWrap={false}
            strokeWidth={2.2}
            onPress={() => navigation.navigate(ScreenNames.ADD_WALLET_SCREEN, { id: 'new' })}
          />
        }
      />

      <View style={styles.section}>
        <WalletActionsSheet
          wallet={menuCard}
          onEdit={onEditPress}
          onDelete={onDeletePress}
          onCancel={closeMenu}
          onDismissed={onMenuDismissed}
        />

        <ConfirmationSheet
          confirmation={
            walletToDelete && {
              title: `Delete “${walletToDelete.wallet.wallet_name}”?`,
              // A wallet is deleted softly: its records stay, under "Deleted wallet".
              description:
                'It leaves your wallets. Its transactions stay in your history and totals, marked “Deleted wallet”.',
              primaryAction: { label: 'Delete wallet', tone: 'danger', busyLabel: 'Deleting…', onPress: onConfirm },
              onCancel: onConfirmCancel,
              isPending: isDeleting,
              message: deleteError ? { text: deleteError } : undefined,
            }
          }
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}

        {hasError && (
          <EmptyState
            icon="wallet"
            title="Couldn't load wallets"
            description="Check your connection and try again."
            actionLabel="Retry"
            onActionPress={retry}
          />
        )}

        {!isLoading && !hasError && wallets.length === 0 && (
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
          <WalletCard {...toWalletCardProps(wallets[0], currencyCode)} onMorePress={() => openMenu(wallets[0])} />
        )}

        {wallets.length > 1 && (
          <Carousel
            items={wallets}
            keyExtractor={(item) => item.wallet.id}
            onIndexChange={(index) => {
              const walletId = wallets[index]?.wallet.id;

              if (walletId !== undefined) {
                onFocusedWalletChange(walletId);
              }
            }}
            renderItem={(item, walletWidth) => (
              <TouchableOpacity
                onLongPress={() => Haptics.impactAsync().then(() => openMenu(item))}
                activeOpacity={0.7}
              >
                <WalletCard
                  {...toWalletCardProps(item, currencyCode)}
                  style={{ width: walletWidth }}
                  onMorePress={() => openMenu(item)}
                />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </>
  );
};

export default WalletsSection;
