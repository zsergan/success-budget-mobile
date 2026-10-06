import { useCallback } from 'react';

import type { TransactionModel } from '@api/models';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { createOpened, detailsOpened } from '@redux/state/transactionFlow/slice';
import { TransactionType } from '@shared/enums';

// Opens the one transaction sheet for the active space; a flow that is already open stays as it is.
const useTransactionFlow = () => {
  const dispatch = useAppDispatch();
  const spaceId = useAppSelector(selectCurrentSpaceId);

  const openCreate = useCallback(
    (transactionType = TransactionType.EXPENSE, walletId?: number) => {
      if (spaceId === null) return;

      dispatch(createOpened({ spaceId, transactionType, walletId: walletId ?? null, now: new Date().toISOString() }));
    },
    [dispatch, spaceId],
  );

  const openDetails = useCallback(
    (transaction: TransactionModel) => {
      if (spaceId !== null) dispatch(detailsOpened({ spaceId, transaction }));
    },
    [dispatch, spaceId],
  );

  return { openCreate, openDetails };
};

export default useTransactionFlow;
