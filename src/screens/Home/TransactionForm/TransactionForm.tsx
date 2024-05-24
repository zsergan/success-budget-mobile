import { useEffect, useRef } from 'react';
import { Text, TextInput, ScrollView, View } from 'react-native';

import { Button, DateTimePicker, RadioButtonGroup, TextArea } from '@components';
import { useAppSelector } from '@redux/hooks';
import { selectCategory } from '@redux/state/category/selectors';
import { selectProfile } from '@redux/state/profile/selectors';
import { selectWallet } from '@redux/state/wallet/selectors';
import { selectTransaction } from '@redux/state/transaction/selectors';
import { TransactionType } from '@shared/enums';
import { useTransactionForm } from './hooks';

import styles from './style';

interface Props {
  transactionType?: TransactionType;
}

const TransactionForm = ({ transactionType = TransactionType.EXPENSE }: Props) => {
  const amountRef = useRef<TextInput>(null);
  const { isCreating } = useAppSelector(selectTransaction);
  const { baseCurrency } = useAppSelector(selectProfile);
  const { wallets } = useAppSelector(selectWallet);
  const { expenses, incomes } = useAppSelector(selectCategory);

  const {
    amount,
    date,
    notes,
    selectedCategory,
    onChangeAmount: setAmount,
    onChangeCategory,
    onChangeDate,
    onChangeNotes: setNotes,
    onSubmit,
  } = useTransactionForm({ wallets, transactionType });

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const categories = (transactionType === TransactionType.EXPENSE ? expenses : incomes).map((expense) => ({
    label: expense.name,
    value: expense.id,
    selected: selectedCategory === expense.id,
  }));

  return (
    <View style={styles.root}>
      <View style={styles.amount}>
        <TextInput
          ref={amountRef}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          inputMode="decimal"
          style={styles.input}
          returnKeyType="done"
        />

        <Text style={styles.input}>{baseCurrency?.code}</Text>
      </View>

      <ScrollView automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View>
            <Text style={[styles.mb8, styles.subtitle]}>Category</Text>
            <RadioButtonGroup buttons={categories} onPress={onChangeCategory} />
          </View>

          <View style={styles.date}>
            <Text style={styles.subtitle}>Date</Text>

            <DateTimePicker value={date} onChange={onChangeDate} />
          </View>

          <View>
            <Text style={[styles.mb8, styles.subtitle]}>Notes</Text>

            <TextArea value={notes} onChangeText={setNotes} blurOnSubmit maxLength={100} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button title="Save" onPress={onSubmit} disabled={isCreating} />
      </View>
    </View>
  );
};

export default TransactionForm;
