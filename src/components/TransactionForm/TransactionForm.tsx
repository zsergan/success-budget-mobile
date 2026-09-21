import { useEffect, useRef, useState } from 'react';
import { Platform, Text, TextInput, useWindowDimensions, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller } from 'react-hook-form';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';

import DateTimePicker from '@components/Form/DateTimePicker/DateTimePicker';
import Icon from '@components/Icon/Icon';
import { useAppSelector } from '@redux/hooks';
import { selectActiveCategories } from '@redux/state/category/selectors';
import { findLimitForCategory, selectLimit } from '@redux/state/limit/selectors';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import { selectWallet } from '@redux/state/wallet/selectors';
import { TransactionType } from '@shared/enums';
import type { IconType } from '@shared/types';
import { gradients, resolveAppColor } from '@shared/constants';
import { formatDateHHMM, formatGroupLabel, hexToRgba } from '@shared/utils';
import LimitHint from './LimitHint/LimitHint';
import useTransactionForm from './useTransactionForm';

import theme, { colors } from '@shared/theme';
import styles from './style';

const SAVE_READY_TEXT_COLOR = '#FFFDFA';

export const TRANSACTION_FORM_SNAP_POINT = '86%';
const SNAP_FRACTION = parseFloat(TRANSACTION_FORM_SNAP_POINT) / 100;

const isValidAmount = (value?: string) => {
  if (!value) return false;

  const normalized = Number(value.replace(',', '.'));

  return Number.isFinite(normalized) && normalized > 0;
};

interface DateFieldProps {
  icon?: IconType;
  label: string;
  mode: 'date' | 'time';
  value: Date;
  onPick: (date: Date) => void;
}

// iOS's compact picker (see DateTimePicker) is its own tappable trigger; Android needs our label to mount it on tap.
const DateField = ({ icon, label, mode, value, onPick }: DateFieldProps) => {
  const [open, setOpen] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.pickerBox}>
        {icon && <Icon name={icon} size={16} color={colors.muted} strokeWidth={1.8} />}
        <DateTimePicker mode={mode} value={value} onChange={onPick} />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.pickerBox} onPress={() => setOpen(true)} activeOpacity={0.6}>
        {icon && <Icon name={icon} size={16} color={colors.muted} strokeWidth={1.8} />}
        <Text style={styles.pickerText}>{label}</Text>
      </TouchableOpacity>

      {open && (
        <DateTimePicker
          mode={mode}
          value={value}
          onChange={(picked) => {
            setOpen(false);
            onPick(picked);
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </>
  );
};

interface Props {
  initialWalletIndex: number;
  transactionType?: TransactionType;
}

const TransactionForm = ({ initialWalletIndex, transactionType = TransactionType.EXPENSE }: Props) => {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const amountRef = useRef<TextInput>(null);
  const { wallets } = useAppSelector(selectWallet);
  const { expenses, incomes } = useAppSelector(selectActiveCategories);
  const { categoryLimits } = useAppSelector(selectLimit);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  const { control, watch, resetField, onSubmit, isSubmitDisabled, closeBottomSheet } = useTransactionForm({
    transactionType,
    initialWalletId: wallets[initialWalletIndex]?.wallet.id ?? -1,
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

  const readyAmount = isValidAmount(amount);
  const readyCategory = categories.some(({ id }) => id === selectedCategoryId);
  const ready = readyAmount && readyCategory;

  const helperText = !readyCategory ? 'Pick a category to save' : !readyAmount ? 'Enter an amount to save' : undefined;

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

        <Controller
          name="transaction_type"
          control={control}
          render={({ field: { onChange, value } }) => (
            <View style={styles.typeSwitch}>
              <TouchableOpacity
                style={[styles.typeTab, value === TransactionType.INCOME && styles.typeTabActive]}
                onPress={() => {
                  onChange(TransactionType.INCOME);
                  resetField('category_id');
                }}
                activeOpacity={0.7}
              >
                <Icon
                  name="income"
                  size={15}
                  color={value === TransactionType.INCOME ? colors.ok : colors.muted}
                  strokeWidth={2.3}
                />
                <Text
                  style={[styles.typeTabText, { color: value === TransactionType.INCOME ? colors.ok : colors.muted }]}
                >
                  Income
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeTab, value === TransactionType.EXPENSE && styles.typeTabActive]}
                onPress={() => {
                  onChange(TransactionType.EXPENSE);
                  resetField('category_id');
                }}
                activeOpacity={0.7}
              >
                <Icon
                  name="expense"
                  size={15}
                  color={value === TransactionType.EXPENSE ? colors.danger : colors.muted}
                  strokeWidth={2.3}
                />
                <Text
                  style={[
                    styles.typeTabText,
                    { color: value === TransactionType.EXPENSE ? colors.danger : colors.muted },
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />

        <View style={[styles.hero, { backgroundColor: hexToRgba(typeColor, 0.07) }]}>
          <Text style={[styles.heroLabel, { color: typeColor }]}>{isIncome ? 'Income amount' : 'Expense amount'}</Text>

          <View style={styles.heroRow}>
            <Controller
              name="amount"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  ref={amountRef}
                  value={value}
                  onChangeText={onChange}
                  placeholder="0"
                  placeholderTextColor={hexToRgba(typeColor, 0.4)}
                  inputMode="decimal"
                  style={[styles.heroAmount, { color: typeColor }]}
                  returnKeyType="done"
                />
              )}
            />

            {selectedWallet && <Text style={[styles.heroCurrency, { color: typeColor }]}>{currencyCode}</Text>}
          </View>

          {selectedWallet && (
            <Text style={styles.heroSub}>
              {currencyCode} · {isIncome ? 'added to' : 'taken from'} {selectedWallet.wallet_name}
            </Text>
          )}
        </View>

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
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Wallet</Text>

            <Controller
              name="wallet_id"
              control={control}
              render={({ field: { onChange, value } }) => (
                <View style={styles.walletsRow}>
                  {wallets.map(({ wallet: { id, wallet_name, design } }) => {
                    const selected = value === id;
                    const dotColor = gradients[resolveAppColor(design)][0];

                    return (
                      <TouchableOpacity
                        key={id}
                        style={[
                          styles.walletChip,
                          selected && { backgroundColor: hexToRgba(typeColor, 0.09), borderColor: typeColor },
                        ]}
                        onPress={() => onChange(id)}
                        activeOpacity={0.6}
                      >
                        <View style={[styles.walletDot, { backgroundColor: dotColor }]} />

                        <Text style={[styles.walletChipText, selected && { color: typeColor }]} numberOfLines={1}>
                          {wallet_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>Category</Text>

              <Text style={[styles.sectionHint, readyCategory && { color: typeColor }]}>
                {categories.find(({ id }) => id === selectedCategoryId)?.name ?? 'Required'}
              </Text>
            </View>

            <Controller
              name="category_id"
              control={control}
              render={({ field: { onChange, value } }) => (
                <View style={styles.categoryGrid}>
                  {categories.map((category) => {
                    const selected = category.id === value;

                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={styles.categoryCell}
                        onPress={() => onChange(category.id)}
                        activeOpacity={0.6}
                      >
                        <View
                          style={[
                            styles.categoryIconBox,
                            selected && { backgroundColor: hexToRgba(typeColor, 0.1), borderColor: typeColor },
                          ]}
                        >
                          <Icon name={category.icon} size={22} color={selected ? typeColor : colors.text} />
                        </View>

                        <Text style={[styles.categoryName, selected && { color: typeColor }]} numberOfLines={2}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          </View>

          <View style={styles.dateTimeRow}>
            <View style={[styles.section, styles.dateBox]}>
              <Text style={styles.sectionLabel}>Date</Text>

              <Controller
                name="date"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <DateField
                    icon="calendar"
                    mode="date"
                    label={formatGroupLabel(value)}
                    value={value}
                    onPick={(picked) => {
                      const next = new Date(value);
                      next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
                      onChange(next);
                    }}
                  />
                )}
              />
            </View>

            <View style={[styles.section, styles.timeBox]}>
              <Text style={styles.sectionLabel}>Time</Text>

              <Controller
                name="date"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <DateField
                    mode="time"
                    label={formatDateHHMM(value)}
                    value={value}
                    onPick={(picked) => {
                      const next = new Date(value);
                      next.setHours(picked.getHours(), picked.getMinutes());
                      onChange(next);
                    }}
                  />
                )}
              />
            </View>
          </View>

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
                  maxLength={160}
                  blurOnSubmit
                  returnKeyType="done"
                />
              )}
            />
          </View>
        </View>
      </BottomSheetScrollView>

      <View style={[styles.footer, { marginBottom: theme.spacing.xl + insets.bottom }]}>
        {helperText && (
          <View style={styles.helperRow}>
            <Icon name="info" size={13} color={colors.muted} strokeWidth={1.8} />
            <Text style={styles.helperText}>{helperText}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,
            ready && styles.saveButtonReady,
            ready && { backgroundColor: typeColor, shadowColor: typeColor },
          ]}
          onPress={onSubmit}
          disabled={!ready || isSubmitDisabled}
          activeOpacity={0.8}
        >
          {ready && <Icon name="check" size={17} color={SAVE_READY_TEXT_COLOR} strokeWidth={2.4} />}

          <Text style={[styles.saveButtonText, ready && { color: SAVE_READY_TEXT_COLOR }]}>
            {ready ? (isIncome ? 'Save income' : 'Save expense') : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TransactionForm;
