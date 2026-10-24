import { useState } from 'react';

import type { GetWalletsResponse } from '@api/dto';
import { useConfirmAction } from '@hooks';
import { getLoadState } from '@redux/api/loadState';
import { useSpaceArg } from '@redux/hooks';
import { useDeleteWalletMutation, useGetWalletsQuery } from '@redux/state/wallet/api';
import { EMPTY_WALLETS } from '@redux/state/wallet/selectors';

const useWalletActions = () => {
  const [selectedWallet, setSelectedWallet] = useState<GetWalletsResponse | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const walletsQuery = useGetWalletsQuery(useSpaceArg());
  const wallets = walletsQuery.currentData?.wallets ?? EMPTY_WALLETS;
  const { isLoading, hasError } = getLoadState(walletsQuery);
  const [deleteWallet] = useDeleteWalletMutation();
  const deletion = useConfirmAction<GetWalletsResponse>();

  const onWalletLongPress = (wallet: GetWalletsResponse) => {
    setSelectedWallet(wallet);
    setIsModalVisible(true);
  };

  const onDeletePress = () => {
    setIsModalVisible(false);

    if (selectedWallet) deletion.open(selectedWallet);
  };

  const onDeleteCancel = () => {
    setIsModalVisible(false);
  };

  const onConfirm = () => deletion.confirm((wallet, spaceId) => deleteWallet({ spaceId, walletId: wallet.wallet.id }));

  return {
    wallets,
    isLoading,
    hasError,
    retry: walletsQuery.refetch,
    selectedWallet,
    isModalVisible,
    walletToDelete: deletion.target,
    isDeleting: deletion.isPending,
    deleteError: deletion.error,
    onWalletLongPress,
    onDeletePress,
    onDeleteCancel,
    onConfirm,
    onConfirmCancel: deletion.cancel,
  };
};

export default useWalletActions;
