import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { defaultWalletId } from '@redux/state/transactionFlow/draft';
import { selectLastWalletId } from '@redux/state/transactionFlow/selectors';
import type { TransactionFlow } from '@redux/state/transactionFlow/slice';
import { walletDefaulted } from '@redux/state/transactionFlow/slice';

// A new draft starts on the wallet it was opened from, else the last one used in this space, else the first active
// one. Only while the wallet is still the one it started with, so a pick or a just-created wallet is never replaced.
const useDefaultWallet = (flow: TransactionFlow, activeWalletIds: number[] | undefined) => {
  const dispatch = useAppDispatch();
  const lastWalletId = useAppSelector((state) => selectLastWalletId(state, flow.spaceId));
  const { draftId, draft, baseline, saved } = flow;
  const walletId = draft?.walletId ?? null;
  const isUntouched = !!baseline && walletId === baseline.walletId;

  useEffect(() => {
    if (saved || !isUntouched || !activeWalletIds) return;
    if (walletId !== null && activeWalletIds.includes(walletId)) return;

    const next = defaultWalletId(activeWalletIds, [lastWalletId]);
    if (next !== walletId) dispatch(walletDefaulted({ draftId, walletId: next }));
  }, [dispatch, draftId, saved, isUntouched, activeWalletIds, walletId, lastWalletId]);
};

export default useDefaultWallet;
