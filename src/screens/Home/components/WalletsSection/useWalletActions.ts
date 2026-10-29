import { useRef, useState } from 'react';

import type { GetWalletsResponse } from '@api/dto';
import { nameOr } from '@components/Toast/message';
import { useConfirmAction } from '@hooks';
import { getLoadState } from '@redux/api/loadState';
import { useAppSelector, useAppStore, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { useDeleteWalletMutation, useGetWalletsQuery } from '@redux/state/wallet/api';
import { EMPTY_WALLETS } from '@redux/state/wallet/selectors';

interface Menu {
  wallet: GetWalletsResponse;
  spaceId: number | null;
  sessionKey: number;
}

interface Props {
  onEdit: (wallet: GetWalletsResponse) => void;
}

const useWalletActions = ({ onEdit }: Props) => {
  const store = useAppStore();
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const sessionKey = useAppSelector((state) => state.auth.sessionKey);
  const walletsQuery = useGetWalletsQuery(useSpaceArg());
  const wallets = walletsQuery.currentData?.wallets ?? EMPTY_WALLETS;
  const { isLoading, hasError } = getLoadState(walletsQuery);
  const [deleteWallet] = useDeleteWalletMutation();
  const deletion = useConfirmAction<GetWalletsResponse>();

  const [menu, setMenu] = useState<Menu | null>(null);
  // A space switch or another session closes the menu.
  const isMenuCurrent = menu !== null && menu.spaceId === spaceId && menu.sessionKey === sessionKey;
  if (menu && !isMenuCurrent) setMenu(null);
  const nextRef = useRef<(Menu & { run: (wallet: GetWalletsResponse) => void }) | null>(null);

  const openMenu = (wallet: GetWalletsResponse) => {
    nextRef.current = null;
    setMenu({ wallet, spaceId, sessionKey });
  };

  const closeMenu = () => setMenu(null);

  // What the menu leads to waits until it has gone, so nothing opens under a sheet still closing.
  const closeMenuThen = (run: (wallet: GetWalletsResponse) => void) => {
    if (!menu || !isMenuCurrent) return;

    nextRef.current = { ...menu, run };
    setMenu(null);
  };

  const onMenuDismissed = () => {
    const next = nextRef.current;
    nextRef.current = null;
    const state = store.getState();
    if (!next || next.spaceId !== selectCurrentSpaceId(state) || next.sessionKey !== state.auth.sessionKey) return;

    next.run(next.wallet);
  };

  const onConfirm = () =>
    deletion.confirm(
      (wallet, spaceId) => deleteWallet({ spaceId, walletId: wallet.wallet.id }),
      (_result, wallet) => ({ tone: 'success', text: `${nameOr(wallet.wallet.wallet_name, 'Wallet')} deleted` }),
    );

  return {
    wallets,
    isLoading,
    hasError,
    retry: walletsQuery.refetch,
    menuWallet: isMenuCurrent ? menu.wallet : null,
    openMenu,
    closeMenu,
    onEditPress: () => closeMenuThen(onEdit),
    onDeletePress: () => closeMenuThen(deletion.open),
    onMenuDismissed,
    walletToDelete: deletion.target,
    isDeleting: deletion.isPending,
    deleteError: deletion.error,
    onConfirm,
    onConfirmCancel: deletion.cancel,
  };
};

export default useWalletActions;
