import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useBottomSheet } from '@gorhom/bottom-sheet';

import type { CreateTransactionRequest } from '@api/dto';
import { Button, DateTimePicker, RadioButtonGroup, TextArea } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCategory } from '@redux/state/category/selectors';
import { selectProfile } from '@redux/state/profile/selectors';
import { selectHolding } from '@redux/state/holding/selectors';
import { selectTransaction } from '@redux/state/transaction/selectors';
import { TransactionType } from '@shared/enums';
import { addTransaction } from '@redux/state/transaction/thunks';

import styles from './style';

interface Props {
  transactionType?: TransactionType;
}

const TransactionForm = ({ transactionType = TransactionType.EXPENSE }: Props) => {
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<null | number>(null);
  const { isCreating } = useAppSelector(selectTransaction);
  const { baseCurrency } = useAppSelector(selectProfile);
  const { holdings } = useAppSelector(selectHolding);
  const { expenses, incomes } = useAppSelector(selectCategory);

  const { close } = useBottomSheet();

  const categories = (transactionType === TransactionType.EXPENSE ? expenses : incomes).map((expense) => ({
    label: expense.name,
    value: expense.id,
    selected: selectedCategory === expense.id,
  }));

  const handlePress = (value: number) => setSelectedCategory(value);

  const handleChangeDate = (_: unknown, newDate?: Date) => {
    setDate(newDate ? new Date(newDate) : new Date());
  };

  const handleCreateTransaction = () => {
    if (!selectedCategory) return;

    const payload: CreateTransactionRequest = {
      amount: Number(amount).toFixed(),
      holding_id: holdings[0].holding.id,
      category_id: selectedCategory,
      timestamp: date,
      transaction_type: transactionType,
      description: notes,
    };

    dispatch(addTransaction(payload)).then(() => close());
  };

  return (
    <View style={styles.root}>
      <View style={styles.amount}>
        <TextInput value={amount} onChangeText={setAmount} placeholder="0" inputMode="decimal" style={styles.input} />

        <Text style={styles.input}>{baseCurrency?.code}</Text>
      </View>

      <View style={styles.container}>
        <View>
          <Text style={[styles.mb8, styles.subtitle]}>Category</Text>
          <RadioButtonGroup buttons={categories} onPress={handlePress} />
        </View>

        <View style={styles.date}>
          <Text style={styles.subtitle}>Date</Text>

          <DateTimePicker value={date} onChange={handleChangeDate} />
        </View>

        <View>
          <Text style={[styles.mb8, styles.subtitle]}>Notes</Text>

          <TextArea value={notes} onChangeText={setNotes} />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Save" onPress={handleCreateTransaction} disabled={isCreating} />
      </View>
    </View>
  );
};

export default TransactionForm;
