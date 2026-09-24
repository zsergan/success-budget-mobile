import { useState } from 'react';

import type { GetWalletsResponse } from '@api/dto';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { useDeleteWalletMutation, useGetWalletsQuery } from '@redux/state/wallet/api';
import { EMPTY_WALLETS } from '@redux/state/wallet/selectors';

const useWalletActions = () => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const [selectedWallet, setSelectedWallet] = useState<GetWalletsResponse | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const { currentData, isFetching, error, refetch } = useGetWalletsQuery(useSpaceArg());
  const wallets = currentData?.wallets ?? EMPTY_WALLETS;
  const [deleteWallet] = useDeleteWalletMutation();

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
    if (selectedWallet && spaceId !== null) {
      deleteWallet({ spaceId, walletId: selectedWallet.wallet.id });
    }

    onConfirmCancel();
  };

  return {
    wallets,
    // A space switch has no currentData until the new space's wallets arrive,
    // so WalletsSection shows loading rather than "no wallets yet" meanwhile.
    isLoading: isFetching,
    error,
    retry: refetch,
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
