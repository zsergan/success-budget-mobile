import { useState } from 'react';

import type { GetWalletsResponse } from '@api/dto';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectWallet } from '@redux/state/wallet/selectors';
import { removeWallet } from '@redux/state/wallet/thunks';

const useWalletActions = () => {
  const dispatch = useAppDispatch();
  const [selectedWallet, setSelectedWallet] = useState<GetWalletsResponse | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const { wallets } = useAppSelector(selectWallet);

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
