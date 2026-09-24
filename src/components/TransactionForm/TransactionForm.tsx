import { useEffect, useMemo, useRef } from 'react';
import type { TextInput } from 'react-native';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Controller } from 'react-hook-form';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';

import Icon from '@components/Icon/Icon';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { getActiveCategories } from '@redux/state/category/selectors';
import { useGetLimitsQuery } from '@redux/state/limit/api';
import { EMPTY_LIMITS, findLimitForCategory } from '@redux/state/limit/selectors';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import { useGetWalletsQuery } from '@redux/state/wallet/api';
import { EMPTY_WALLETS } from '@redux/state/wallet/selectors';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';
import ActionRow from './ActionRow/ActionRow';
import AmountField from './AmountField/AmountField';
import CategoryPicker from './CategoryPicker/CategoryPicker';
import DateTimeRow from './DateTimeRow/DateTimeRow';
import LimitHint from './LimitHint/LimitHint';
import TypeToggle from './TypeToggle/TypeToggle';
import WalletPicker from './WalletPicker/WalletPicker';
import useTransactionForm from './useTransactionForm';

import styles from './style';

export const TRANSACTION_FORM_SNAP_POINT = '86%';
const SNAP_FRACTION = parseFloat(TRANSACTION_FORM_SNAP_POINT) / 100;

interface Props {
  initialWalletId: number;
  transactionType?: TransactionType;
}

const TransactionForm = ({ initialWalletId, transactionType = TransactionType.EXPENSE }: Props) => {
  const { height: windowHeight } = useWindowDimensions();
  const amountRef = useRef<TextInput>(null);
  const spaceArg = useSpaceArg();
  const wallets = useGetWalletsQuery(spaceArg).currentData?.wallets ?? EMPTY_WALLETS;
  const { currentData: allCategories } = useGetCategoriesQuery(spaceArg);
  const { expenses, incomes } = useMemo(() => getActiveCategories(allCategories), [allCategories]);
  const { categoryLimits } = useGetLimitsQuery(spaceArg).currentData ?? EMPTY_LIMITS;
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  const { control, watch, resetField, onSubmit, isSubmitDisabled, isValid, errors, closeBottomSheet } =
    useTransactionForm({
      transactionType,
      initialWalletId,
    });

  const selectedWalletId = watch('wallet_id');
  const selectedTransactionType = watch('transaction_type');
  const selectedCategoryId = watch('category_id');
  const amount = watch('amount');

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  if (wallets.length === 0) {
    return (
      <View style={styles.root}>
        <Text style={styles.emptyText}>Add a wallet first to record a transaction.</Text>
      </View>
    );
  }

  const isIncome = selectedTransactionType === TransactionType.INCOME;
  const typeColor = isIncome ? colors.ok : colors.danger;
  const categories = isIncome ? incomes : expenses;
  const selectedWallet = wallets.find(({ wallet: { id } }) => id === selectedWalletId)?.wallet;

  const ready = isValid;
  const helperText = errors.category_id
    ? 'Pick a category to save'
    : errors.amount
      ? 'Enter an amount to save'
      : undefined;

  const matchedLimit =
    !isIncome && selectedCategoryId !== undefined
      ? findLimitForCategory(categoryLimits, selectedCategoryId)
      : undefined;

  return (
    <View style={[styles.root, { height: windowHeight * SNAP_FRACTION }]}>
      <View style={styles.topBlock}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>New transaction</Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => closeBottomSheet()}
            activeOpacity={0.6}
            hitSlop={8}
          >
            <Icon name="close" size={14} color={colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
        </View>

        <TypeToggle control={control} onTypeChange={() => resetField('category_id')} />

        <AmountField
          control={control}
          amountRef={amountRef}
          typeColor={typeColor}
          isIncome={isIncome}
          currencyCode={currencyCode}
          selectedWalletName={selectedWallet?.wallet_name}
        />

        {matchedLimit && (
          <View style={styles.limitHint}>
            <LimitHint limit={matchedLimit} amount={amount} currencyCode={currencyCode} />
          </View>
        )}
      </View>

      <BottomSheetScrollView
        style={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <WalletPicker control={control} wallets={wallets} typeColor={typeColor} />

          <CategoryPicker control={control} categories={categories} typeColor={typeColor} />

          <DateTimeRow control={control} />

          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>Note</Text>
              <Text style={styles.sectionHint}>optional</Text>
            </View>

            <Controller
              name="notes"
              control={control}
              render={({ field: { onChange, value } }) => (
                <BottomSheetTextInput
                  style={styles.note}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Add a note…"
                  placeholderTextColor={colors.muted}
                  multiline
                  maxLength={140}
                  blurOnSubmit
                  returnKeyType="done"
                />
              )}
            />
          </View>
        </View>
      </BottomSheetScrollView>

      <ActionRow
        helperText={helperText}
        ready={ready}
        isSubmitDisabled={isSubmitDisabled}
        isIncome={isIncome}
        onPress={onSubmit}
      />
    </View>
  );
};

export default TransactionForm;
