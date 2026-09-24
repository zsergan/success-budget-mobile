import { useState } from 'react';

import type { GetWalletsResponse } from '@api/dto';
import { useConfirmAction } from '@hooks';
import { requireSpaceId } from '@redux/api/baseApi';
import { getLoadState } from '@redux/api/loadState';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { useDeleteWalletMutation, useGetWalletsQuery } from '@redux/state/wallet/api';
import { EMPTY_WALLETS } from '@redux/state/wallet/selectors';

const useWalletActions = () => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const [selectedWallet, setSelectedWallet] = useState<GetWalletsResponse | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const walletsQuery = useGetWalletsQuery(useSpaceArg());
  const wallets = walletsQuery.currentData?.wallets ?? EMPTY_WALLETS;
  const { isLoading, hasError } = getLoadState(walletsQuery);
  const [deleteWallet] = useDeleteWalletMutation();
  const { run, isPending: isDeleting, error: deleteError, resetError } = useConfirmAction();

  const onWalletLongPress = (wallet: GetWalletsResponse) => {
    setSelectedWallet(wallet);
    setIsModalVisible(true);
  };

  const onDeletePress = () => {
    setIsModalVisible(false);
    resetError();
    setIsConfirmVisible(true);
  };

  const onDeleteCancel = () => {
    setIsModalVisible(false);
  };

  const onConfirmCancel = () => {
    setIsConfirmVisible(false);
    setSelectedWallet(undefined);
  };

  const onConfirm = () => {
    if (!selectedWallet) return;

    run(() => deleteWallet({ spaceId: requireSpaceId(spaceId), walletId: selectedWallet.wallet.id }), onConfirmCancel);
  };

  return {
    wallets,
    isLoading,
    hasError,
    retry: walletsQuery.refetch,
    selectedWallet,
    isModalVisible,
    isConfirmVisible,
    isDeleting,
    deleteError,
    onWalletLongPress,
    onDeletePress,
    onDeleteCancel,
    onConfirm,
    onConfirmCancel,
  };
};

export default useWalletActions;
