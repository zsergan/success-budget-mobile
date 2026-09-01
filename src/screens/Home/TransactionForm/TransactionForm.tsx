import { useEffect, useRef } from 'react';
import { Text, TextInput, ScrollView, View, TouchableOpacity } from 'react-native';
import { Controller } from 'react-hook-form';

import type { RadioButtons } from '@components';
import { Button, DateTimePicker, RadioGroup, SectionTitle, TextArea, TinyButton, TinyWallet } from '@components';
import type { Category } from '@api/dto';
import { useAppSelector } from '@redux/hooks';
import { selectActiveCategories } from '@redux/state/category/selectors';
import { selectWallet } from '@redux/state/wallet/selectors';
import { ScreenNames, TransactionType } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import useTransactionForm from './useTransactionForm';

import { palette } from '@shared/theme';
import styles from './style';

const TINY_WALLET_WIDTH_WITH_GAP = 118;

const transactionTypes: RadioButtons<string>[] = [
  {
    title: 'Expense',
    value: TransactionType.EXPENSE,
    icon: 'arrow-outward',
    color: palette.red,
    size: 'md',
  },
  {
    title: 'Income',
    value: TransactionType.INCOME,
    icon: 'arrow-downward',
    color: palette.green,
    size: 'md',
  },
];

const getCategoryRadioButtons = (categories: Category[]): RadioButtons<number>[] =>
  categories.map((expense) => ({
    title: expense.name,
    value: expense.id,
    icon: expense.icon,
    color: expense.color,
    size: 'md',
  }));

interface Props {
  navigation: ScreenProps<ScreenNames.HOME_TAB>['navigation'];
  initialWalletIndex: number;
  transactionType?: TransactionType;
}

const TransactionForm = ({ navigation, initialWalletIndex, transactionType = TransactionType.EXPENSE }: Props) => {
  const amountRef = useRef<TextInput>(null);
  const walletsRef = useRef<ScrollView>(null);
  const { wallets } = useAppSelector(selectWallet);
  const { expenses, incomes } = useAppSelector(selectActiveCategories);

  const { control, watch, onSubmit, isSubmitSuccessful, closeBottomSheet } = useTransactionForm({
    transactionType,
    initialWalletId: wallets[initialWalletIndex]?.wallet.id ?? -1,
  });

  const selectedWallet = watch('wallet_id');
  const selectedTransactionType = watch('transaction_type');

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  if (wallets.length === 0) {
    return (
      <View style={[styles.root, styles.container]}>
        <Text style={styles.input}>Add a wallet first to record a transaction.</Text>
      </View>
    );
  }

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
          <View style={styles.section}>
            <SectionTitle title="Wallet" />

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
                          backgroundStyle={value === id ? 'gradient' : 'grey'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            />
          </View>

          <View style={styles.section}>
            <SectionTitle title="Transaction type" />

            <Controller
              name="transaction_type"
              control={control}
              render={({ field: { onChange, value } }) => (
                <RadioGroup value={value} buttons={transactionTypes} onPress={onChange} />
              )}
            />
          </View>

          <View style={styles.section}>
            <SectionTitle
              title="Category"
              button={
                <TinyButton
                  selected
                  title="Add Category"
                  icon="add"
                  onPress={() => {
                    closeBottomSheet();
                    navigation.navigate(ScreenNames.ADD_CATEGORY_SCREEN, { id: 'new' });
                  }}
                />
              }
            />

            <Controller
              name="category_id"
              control={control}
              render={({ field: { onChange, value } }) => (
                <RadioGroup
                  value={value}
                  buttons={getCategoryRadioButtons(
                    selectedTransactionType === TransactionType.EXPENSE ? expenses : incomes,
                  )}
                  onPress={onChange}
                />
              )}
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

          <View style={styles.section}>
            <SectionTitle title="Notes" />

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
