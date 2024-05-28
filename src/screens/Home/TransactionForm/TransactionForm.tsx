import { useEffect, useRef } from 'react';
import { Text, TextInput, ScrollView, View, TouchableOpacity } from 'react-native';

import { Button, DateTimePicker, RadioButtonGroup, SectionTitle, TextArea, TinyWallet } from '@components';
import { useAppSelector } from '@redux/hooks';
import { selectCategory } from '@redux/state/category/selectors';
import { selectWallet } from '@redux/state/wallet/selectors';
import { selectTransaction } from '@redux/state/transaction/selectors';
import { TransactionType } from '@shared/enums';
import type { IconType } from '@shared/types';
import { palette } from '@shared/theme';
import useTransactionForm from './useTransactionForm';

import styles from './style';

interface Props {
  transactionType?: TransactionType;
}

const TransactionForm = ({ transactionType = TransactionType.EXPENSE }: Props) => {
  const amountRef = useRef<TextInput>(null);
  const { isCreating } = useAppSelector(selectTransaction);
  const { wallets } = useAppSelector(selectWallet);
  const { expenses, incomes } = useAppSelector(selectCategory);

  const {
    amount,
    selectedWallet,
    selectedTransactionType,
    date,
    notes,
    selectedCategory,
    onChangeAmount: setAmount,
    onChangeWallet,
    onChangeTransactionType,
    onChangeCategory,
    onChangeDate,
    onChangeNotes: setNotes,
    onSubmit,
  } = useTransactionForm({ wallets, transactionType });

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const categories = (selectedTransactionType === TransactionType.EXPENSE ? expenses : incomes).map((expense) => ({
    title: expense.name,
    value: expense.id,
    selected: selectedCategory === expense.id,
    icon: 'store' as IconType,
  }));

  const transactionTypes = [
    {
      title: 'Expense',
      value: TransactionType.EXPENSE,
      selected: selectedTransactionType === TransactionType.EXPENSE,
      icon: 'arrow-outward' as IconType,
      color: palette.red,
    },
    {
      title: 'Income',
      value: TransactionType.INCOME,
      selected: selectedTransactionType === TransactionType.INCOME,
      icon: 'arrow-downward' as IconType,
      color: palette.green,
    },
  ];

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

        <Text style={styles.input}>
          {wallets.find(({ wallet: { id } }) => id === selectedWallet)?.wallet.currency.code}
        </Text>
      </View>

      <ScrollView automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View>
            <SectionTitle title="Wallet" style={styles.section} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollWalletsContainer}>
              <View style={styles.walletsContainer}>
                {wallets.map(({ wallet: { id, wallet_name, design, currency } }) => (
                  <TouchableOpacity key={id} onPress={() => onChangeWallet(id)} activeOpacity={0.5}>
                    <TinyWallet
                      walletName={wallet_name}
                      currencyCode={currency.code}
                      design={design}
                      backgroundStyle={selectedWallet === id ? 'gradient' : 'border'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View>
            <SectionTitle title="Transaction type" style={styles.section} />

            <RadioButtonGroup buttons={transactionTypes} onPress={onChangeTransactionType} />
          </View>

          <View>
            <SectionTitle title="Category" style={styles.section} />

            <RadioButtonGroup buttons={categories} onPress={onChangeCategory} />
          </View>

          <SectionTitle
            title="Date"
            style={styles.section}
            button={<DateTimePicker value={date} onChange={onChangeDate} />}
          />

          <View>
            <SectionTitle title="Notes" style={styles.section} />

            <TextArea
              placeholder="Your notes"
              value={notes}
              onChangeText={setNotes}
              blurOnSubmit
              maxLength={160}
              minHeight={88}
            />
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
