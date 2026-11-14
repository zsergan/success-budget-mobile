import { useCallback, useEffect, useRef } from 'react';

import type { TransactionModel } from '@api/models';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { ViewSelection } from '@redux/state/transactionFlow/selection';
import { createOpened } from '@redux/state/transactionFlow/slice';
import { openTransactionDetails } from '@redux/state/transactionFlow/thunks';
import { TransactionType } from '@shared/enums';

// Starts the one transaction flow of the active space: a new transaction's form opens as a screen and a record's
// details as a sheet, once the flow has taken the step. A flow that is already open stays as it is.
// `selection` is what the calling screen shows, so a new record's confirmation can say when it is not there.
const useTransactionFlow = (selection: ViewSelection | null = null) => {
  const dispatch = useAppDispatch();
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const selectionRef = useRef(selection);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  const openCreate = useCallback(
    (transactionType = TransactionType.EXPENSE, walletId?: number) => {
      if (spaceId === null) return;

      dispatch(
        createOpened({
          spaceId,
          transactionType,
          walletId: walletId ?? null,
          now: new Date().toISOString(),
          selection: selectionRef.current,
        }),
      );
    },
    [dispatch, spaceId],
  );

  const openDetails = useCallback(
    (transaction: TransactionModel) => {
      if (spaceId !== null) dispatch(openTransactionDetails({ spaceId, transaction }));
    },
    [dispatch, spaceId],
  );

  return { openCreate, openDetails };
};

export default useTransactionFlow;
