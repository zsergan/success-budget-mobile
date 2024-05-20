import { useState } from 'react';
import { Keyboard } from 'react-native';
import { useBottomSheet } from '@gorhom/bottom-sheet';

import type { CreateTransactionRequest, GetHoldingsResponse } from '@api/dto';
import type { TransactionType } from '@shared/enums';
import { useAppDispatch } from '@redux/hooks';
import { addTransaction } from '@redux/state/transaction/thunks';
import { addCurrentTime } from '@shared/utils';

interface UseTransactionFormProps {
  holdings: GetHoldingsResponse[];
  transactionType: TransactionType;
}

const useTransactionForm = ({ holdings, transactionType }: UseTransactionFormProps) => {
  const dispatch = useAppDispatch();
  const { close } = useBottomSheet();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<null | number>(null);

  const onChangeCategory = (value: number) => {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }

    setSelectedCategory(value);
  };

  const onChangeDate = (_: unknown, newDate?: Date) => {
    setDate(newDate ? new Date(newDate) : new Date());
  };

  const onSubmit = () => {
    if (!selectedCategory) return;

    const payload: CreateTransactionRequest = {
      amount: amount.replace(',', '.'),
      holding_id: holdings[0].holding.id,
      category_id: selectedCategory,
      timestamp: addCurrentTime(date),
      transaction_type: transactionType,
      description: notes,
    };

    dispatch(addTransaction(payload)).then(() => close());
  };

  return {
    amount,
    date,
    notes,
    selectedCategory,
    onChangeAmount: setAmount,
    onChangeCategory,
    onChangeDate,
    onChangeNotes: setNotes,
    onSubmit,
  };
};

export default useTransactionForm;
