import { useRef } from 'react';

import { useToast } from '@hooks';
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
  const toast = useToast();
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

  // Retry repeats the check, which only reads.
  const addTransaction = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    const ticket = toast.begin();

    try {
      const check = await checkWallets();

      if (check === 'hasWallets') onHasWallets();
      if (check === 'noWallets') onNoWallets();
      if (check === 'failed') {
        ticket.show({
          tone: 'error',
          text: 'Couldn’t load your wallets. Check your connection and try again.',
          subject: 'stats-wallet-check',
          action: { label: 'Retry', onPress: () => void addTransaction() },
        });
      }
    } finally {
      isCheckingRef.current = false;
    }
  };

  return addTransaction;
};

export default useAddTransaction;
