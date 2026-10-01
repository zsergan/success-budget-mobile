import { useRef } from 'react';

import { useAlert } from '@hooks';
import { useAppDispatch, useAppStore, useSessionGuard } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { walletApi } from '@redux/state/wallet/api';

type WalletCheck = 'hasWallets' | 'noWallets' | 'failed' | 'stale';

interface Props {
  onHasWallets: () => void;
  onNoWallets: () => void;
}

// Add transaction asks for the space's wallets first: a request in flight is awaited, and a failed one is not an empty list.
const useAddTransaction = ({ onHasWallets, onNoWallets }: Props) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const captureSession = useSessionGuard();
  const { addAlert } = useAlert();
  const isCheckingRef = useRef(false);

  const checkWallets = async (): Promise<WalletCheck> => {
    const spaceId = selectCurrentSpaceId(store.getState());
    if (spaceId === null) return 'stale';

    const isSessionCurrent = captureSession();
    const result = await dispatch(walletApi.endpoints.getWallets.initiate({ spaceId }, { subscribe: false }));

    if (!isSessionCurrent() || selectCurrentSpaceId(store.getState()) !== spaceId) return 'stale';
    if (result.isError || !result.data) return 'failed';

    return result.data.wallets.length > 0 ? 'hasWallets' : 'noWallets';
  };

  return async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const check = await checkWallets();

      if (check === 'hasWallets') onHasWallets();
      if (check === 'noWallets') onNoWallets();
      if (check === 'failed') addAlert("Couldn't load your wallets. Check your connection and try again.");
    } finally {
      isCheckingRef.current = false;
    }
  };
};

export default useAddTransaction;
