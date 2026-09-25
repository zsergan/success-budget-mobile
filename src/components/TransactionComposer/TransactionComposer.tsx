import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import { BottomSheetModal as BottomModal, TransactionForm } from '@components';
import { TRANSACTION_FORM_SNAP_POINT } from '@components/TransactionForm/TransactionForm';
import { TransactionType } from '@shared/enums';

export interface TransactionComposerHandle {
  openExpense: () => void;
  openIncome: () => void;
}

interface Props {
  initialWalletId: number;
}

const TransactionComposer = forwardRef<TransactionComposerHandle, Props>(({ initialWalletId }, ref) => {
  const expenseRef = useRef<BottomSheetModal>(null);
  const incomeRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    openExpense: () => expenseRef.current?.present(),
    openIncome: () => incomeRef.current?.present(),
  }));

  return (
    <>
      <BottomModal ref={expenseRef} snapPoint={TRANSACTION_FORM_SNAP_POINT}>
        <TransactionForm initialWalletId={initialWalletId} />
      </BottomModal>

      <BottomModal ref={incomeRef} snapPoint={TRANSACTION_FORM_SNAP_POINT}>
        <TransactionForm initialWalletId={initialWalletId} transactionType={TransactionType.INCOME} />
      </BottomModal>
    </>
  );
});

TransactionComposer.displayName = 'TransactionComposer';

export default TransactionComposer;
