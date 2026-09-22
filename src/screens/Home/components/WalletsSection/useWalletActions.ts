import { useState } from 'react';

import type { GetWalletsResponse } from '@api/dto';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectWallet } from '@redux/state/wallet/selectors';
import { fetchWallets, removeWallet } from '@redux/state/wallet/thunks';

const useWalletActions = () => {
  const dispatch = useAppDispatch();
  const [selectedWallet, setSelectedWallet] = useState<GetWalletsResponse | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const { wallets, isLoading, error } = useAppSelector(selectWallet);

  const retry = () => dispatch(fetchWallets());

  const onWalletLongPress = (wallet: GetWalletsResponse) => {
    setSelectedWallet(wallet);
    setIsModalVisible(true);
  };

  const onDeletePress = () => {
    setIsModalVisible(false);
    setIsConfirmVisible(true);
  };

  const onDeleteCancel = () => {
    setIsModalVisible(false);
  };

  const onConfirmCancel = () => {
    setIsConfirmVisible(false);
  };

  const onConfirm = () => {
    if (selectedWallet) {
      dispatch(removeWallet(selectedWallet.wallet.id));
    }

    onConfirmCancel();
  };

  return {
    wallets,
    // Both a space switch (isLoading set synchronously by the context
    // reset) and the true first load flow through this -- WalletsSection
    // must not render "no wallets yet" while either is still in flight, or
    // after a fetch failed, only once it's genuinely empty.
    isLoading,
    error,
    retry,
    selectedWallet,
    isModalVisible,
    isConfirmVisible,
    onWalletLongPress,
    onDeletePress,
    onDeleteCancel,
    onConfirm,
    onConfirmCancel,
  };
};

export default useWalletActions;
