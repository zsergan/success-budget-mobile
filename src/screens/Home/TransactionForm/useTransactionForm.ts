import { useState } from 'react';
import { Keyboard } from 'react-native';
import { useBottomSheet } from '@gorhom/bottom-sheet';

import type { CreateTransactionRequest, GetWalletsResponse } from '@api/dto';
import type { TransactionType } from '@shared/enums';
import { useAppDispatch } from '@redux/hooks';
import { addTransaction } from '@redux/state/transaction/thunks';
import { addCurrentTime } from '@shared/utils';

interface UseTransactionFormProps {
  wallets: GetWalletsResponse[];
  transactionType: TransactionType;
}

const useTransactionForm = ({ wallets, transactionType }: UseTransactionFormProps) => {
  const dispatch = useAppDispatch();
  const { close } = useBottomSheet();

  const [amount, setAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(wallets[0].wallet.id);
  const [selectedTransactionType, setSelectedTransactionType] = useState(transactionType);
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
      wallet_id: selectedWallet,
      category_id: selectedCategory,
      timestamp: addCurrentTime(date),
      transaction_type: selectedTransactionType,
      description: notes,
    };

    dispatch(addTransaction(payload)).then(() => close());
  };

  return {
    amount,
    selectedWallet,
    selectedTransactionType,
    date,
    notes,
    selectedCategory,
    onChangeAmount: setAmount,
    onChangeWallet: setSelectedWallet,
    onChangeTransactionType: setSelectedTransactionType,
    onChangeCategory,
    onChangeDate,
    onChangeNotes: setNotes,
    onSubmit,
  };
};

export default useTransactionForm;
