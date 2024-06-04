import { useEffect, useRef } from 'react';
import { Text, TextInput, ScrollView, View, TouchableOpacity } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, DateTimePicker, RadioButtonGroup, SectionTitle, TextArea, TinyWallet } from '@components';
import { useAppSelector } from '@redux/hooks';
import { selectActiveCategories } from '@redux/state/category/selectors';
import { selectWallet } from '@redux/state/wallet/selectors';
import { TransactionType } from '@shared/enums';
import type { IconType } from '@shared/types';
import { palette } from '@shared/theme';
import useTransactionForm from './useTransactionForm';

import styles from './style';

const TINY_WALLET_WIDTH_WITH_GAP = 118;

interface Props {
  initialWalletIndex: number;
  transactionType?: TransactionType;
}

const TransactionForm = ({ initialWalletIndex, transactionType = TransactionType.EXPENSE }: Props) => {
  const amountRef = useRef<TextInput>(null);
  const walletsRef = useRef<ScrollView>(null);
  const { wallets } = useAppSelector(selectWallet);
  const { expenses, incomes } = useAppSelector(selectActiveCategories);

  const { control, watch, onSubmit, isSubmitSuccessful } = useTransactionForm({
    transactionType,
    initialWalletId: wallets[initialWalletIndex].wallet.id,
  });

  const selectedWallet = watch('wallet_id');
  const selectedTransactionType = watch('transaction_type');
  const selectedCategory = watch('category_id');

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const categories = (selectedTransactionType === TransactionType.EXPENSE ? expenses : incomes).map((expense) => ({
    title: expense.name,
    value: expense.id,
    selected: selectedCategory === expense.id,
    icon: expense.icon,
    color: expense.color,
    size: 'md' as 'sm' | 'md',
  }));

  const transactionTypes = [
    {
      title: 'Expense',
      value: TransactionType.EXPENSE,
      selected: selectedTransactionType === TransactionType.EXPENSE,
      icon: 'arrow-outward' as IconType,
      color: palette.red,
      size: 'md' as 'sm' | 'md',
    },
    {
      title: 'Income',
      value: TransactionType.INCOME,
      selected: selectedTransactionType === TransactionType.INCOME,
      icon: 'arrow-downward' as IconType,
      color: palette.green,
      size: 'md' as 'sm' | 'md',
    },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.amount}>
        <Controller
          name="amount"
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              ref={amountRef}
              value={value}
              onChangeText={onChange}
              placeholder="0"
              inputMode="decimal"
              style={styles.input}
              returnKeyType="done"
            />
          )}
        />

        <Text style={styles.input}>
          {wallets.find(({ wallet: { id } }) => id === selectedWallet)?.wallet.currency.code}
        </Text>
      </View>

      <ScrollView automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View>
            <SectionTitle title="Wallet" style={styles.section} />

            <Controller
              name="wallet_id"
              control={control}
              render={({ field: { onChange, value } }) => (
                <ScrollView
                  ref={walletsRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.scrollWalletsContainer}
                  onLayout={() =>
                    walletsRef.current?.scrollTo({
                      x: TINY_WALLET_WIDTH_WITH_GAP * initialWalletIndex,
                      animated: false,
                    })
                  }
                >
                  <View style={styles.walletsContainer}>
                    {wallets.map(({ wallet: { id, wallet_name, design, currency } }) => (
                      <TouchableOpacity key={id} onPress={() => onChange(id)} activeOpacity={0.5}>
                        <TinyWallet
                          walletName={wallet_name}
                          currencyCode={currency.code}
                          design={design}
                          backgroundStyle={value === id ? 'gradient' : 'border'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            />
          </View>

          <View>
            <SectionTitle title="Transaction type" style={styles.section} />

            <Controller
              name="transaction_type"
              control={control}
              render={({ field: { onChange } }) => <RadioButtonGroup buttons={transactionTypes} onPress={onChange} />}
            />
          </View>

          <View>
            <SectionTitle title="Category" style={styles.section} />

            <Controller
              name="category_id"
              control={control}
              render={({ field: { onChange } }) => <RadioButtonGroup buttons={categories} onPress={onChange} />}
            />
          </View>

          <SectionTitle
            title="Date"
            style={styles.section}
            button={
              <Controller
                name="date"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <DateTimePicker
                    value={value}
                    onChange={(_, v) => (v ? onChange(new Date(v)) : onChange(new Date()))}
                  />
                )}
              />
            }
          />

          <View>
            <SectionTitle title="Notes" style={styles.section} />

            <Controller
              name="notes"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextArea
                  placeholder="Your notes"
                  value={value}
                  onChangeText={onChange}
                  blurOnSubmit
                  maxLength={160}
                  minHeight={88}
                />
              )}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button title="Save" onPress={onSubmit} disabled={isSubmitSuccessful} />
      </View>
    </View>
  );
};

export default TransactionForm;
