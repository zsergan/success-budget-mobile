import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectWallet } from '@redux/state/wallet/selectors';
import { removeWallet } from '@redux/state/wallet/thunks';

const useWalletsData = () => {
  const dispatch = useAppDispatch();
  const [walletToDelete, setWalletToDelete] = useState<number | undefined>(undefined);
  const { wallets } = useAppSelector(selectWallet);

  const onDeletePres = (walletId: number) => setWalletToDelete(walletId);

  const onDeleteCancel = () => setWalletToDelete(undefined);

  const onDeleteConfirm = () => {
    if (walletToDelete) {
      dispatch(removeWallet(walletToDelete));
    }

    onDeleteCancel();
  };

  return {
    wallets,
    isModalVisible: walletToDelete !== undefined,
    onDeletePres,
    onDeleteCancel,
    onDeleteConfirm,
  };
};

export default useWalletsData;
