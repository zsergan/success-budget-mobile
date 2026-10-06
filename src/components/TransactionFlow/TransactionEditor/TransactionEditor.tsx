import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import type { BottomSheetScrollViewMethods } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@components/Icon/Icon';
import { useAlert } from '@hooks';
import { useAppDispatch, useAppSelector, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { getActiveCategories } from '@redux/state/category/selectors';
import { useGetLimitsQuery } from '@redux/state/limit/api';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import type { TransactionDraft } from '@redux/state/transactionFlow/draft';
import {
  DESCRIPTION_MAX_LENGTH,
  descriptionLength,
  getDraftErrors,
  hasDraftErrors,
} from '@redux/state/transactionFlow/draft';
import { hasUnsavedChanges } from '@redux/state/transactionFlow/selectors';
import type { TransactionFlow } from '@redux/state/transactionFlow/slice';
import { categoriesOpened, dateTimeOpened, draftChanged } from '@redux/state/transactionFlow/slice';
import { loadLatestRecord } from '@redux/state/transactionFlow/thunks';
import { useGetWalletsQuery } from '@redux/state/wallet/api';
import { TransactionType } from '@shared/enums';
import theme, { colors } from '@shared/theme';
import FlowBanner from '../FlowBanner/FlowBanner';
import ActionRow from './ActionRow/ActionRow';
import AmountField from './AmountField/AmountField';
import CategoryGrid from './CategoryGrid/CategoryGrid';
import { buildCategoryGrid } from './CategoryGrid/categoryLayout';
import DateChip from './DateChip/DateChip';
import { forecastLimit } from './LimitHint/limitForecast';
import LimitHint from './LimitHint/LimitHint';
import TypeToggle from './TypeToggle/TypeToggle';
import useDefaultWallet from './useDefaultWallet';
import useKeyboardHeight from './useKeyboardHeight';
import WalletPicker from './WalletPicker/WalletPicker';

import styles from './style';

export const EDITOR_HEIGHT_FRACTION = 0.86;

interface Props {
  flow: TransactionFlow & { draft: TransactionDraft };
  onSave: () => void;
  onBack: () => void;
  onClose: () => void;
  onCreateWallet: () => void;
  onCreateCategory: () => void;
}

const TransactionEditor = ({ flow, onSave, onBack, onClose, onCreateWallet, onCreateCategory }: Props) => {
  const dispatch = useAppDispatch();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<BottomSheetScrollViewMethods>(null);
  const [isNoteFocused, setNoteFocused] = useState(false);
  const [isLoadingLatest, setLoadingLatest] = useState(false);
  const { addAlert } = useAlert();
  const spaceArg = useSpaceArg();
  const { currentData: walletsOverview } = useGetWalletsQuery(spaceArg);
  const { currentData: allCategories } = useGetCategoriesQuery(spaceArg);
  const { currentData: limits } = useGetLimitsQuery(spaceArg);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  const { draft, saved, isSaving } = flow;
  const isEdit = saved !== null;
  const isIncome = draft.transactionType === TransactionType.INCOME;
  const typeColor = isIncome ? colors.ok : colors.danger;
  const now = new Date();

  const wallets = useMemo(() => walletsOverview?.wallets.map(({ wallet }) => wallet) ?? [], [walletsOverview]);
  const activeWalletIds = useMemo(() => walletsOverview?.wallets.map(({ wallet }) => wallet.id), [walletsOverview]);
  const { incomes, expenses } = useMemo(() => getActiveCategories(allCategories), [allCategories]);
  const activeOf = (type: TransactionType) => (type === TransactionType.INCOME ? incomes : expenses);
  // Only the record's own archived category is offered, and only for its type.
  const archived = saved?.category.isArchived ? saved.category : null;
  const ownArchived = archived?.transactionType === draft.transactionType ? archived : null;

  useDefaultWallet(flow, activeWalletIds);

  const fitsType = (categoryId: number | null, type: TransactionType) =>
    categoryId !== null &&
    (activeOf(type).some(({ id }) => id === categoryId) ||
      (archived?.id === categoryId && archived.transactionType === type));

  const grid = buildCategoryGrid({
    active: activeOf(draft.transactionType),
    archived: ownArchived,
    promotedId: flow.promotedCategoryId,
  });

  const change = (patch: Parameters<typeof draftChanged>[0]) => dispatch(draftChanged(patch));

  // A category of the other type cannot stay picked.
  const changeType = (transactionType: TransactionType) => {
    if (transactionType === draft.transactionType) return;

    change({ transactionType, ...(!fitsType(draft.categoryId, transactionType) && { categoryId: null }) });
  };

  const errors = getDraftErrors(draft, {
    baseline: isEdit ? (flow.baseline ?? undefined) : undefined,
    now: now.getTime(),
    available: {
      walletIds: activeWalletIds,
      categoryIds: allCategories && [
        ...activeOf(draft.transactionType).map(({ id }) => id),
        ...(ownArchived ? [ownArchived.id] : []),
      ],
    },
  });
  const isChanged = hasUnsavedChanges(flow);
  const hasConflict = flow.notice === 'conflict';
  const ready = !hasDraftErrors(errors) && (!isEdit || isChanged) && !hasConflict;
  // A typed value that is not an amount, and a date out of range, are explained at their fields; the footer names
  // what is still missing.
  const amountError = draft.amount.trim() ? errors.amount : undefined;
  const missing = [amountError ? undefined : errors.amount, errors.category, errors.wallet, errors.description];
  const helperText = isEdit && !isChanged ? undefined : missing.find(Boolean);

  const limitForecast = forecastLimit({
    limits,
    original: saved && { ...saved, categoryId: saved.category.id },
    draft,
    now: now.getTime(),
  });

  const hasDeletedWallet = isEdit && saved.wallet === null;
  const hasNoWallets = activeWalletIds?.length === 0;
  const walletHint = hasDeletedWallet
    ? hasNoWallets
      ? 'This wallet was deleted and you have no other wallets. Keep it, or create a new one to move the transaction.'
      : 'This wallet was deleted. You can keep it or move the transaction to another wallet.'
    : !isEdit && hasNoWallets
      ? 'Create a wallet to save this transaction.'
      : undefined;

  // Above the keyboard the form shrinks to what is left, so Save stays in view and the fields scroll under it.
  const height = Math.min(
    windowHeight * EDITOR_HEIGHT_FRACTION,
    keyboardHeight > 0 ? windowHeight - keyboardHeight - insets.top - theme.spacing.sm : Infinity,
  );

  useEffect(() => {
    if (isNoteFocused && keyboardHeight > 0) scrollRef.current?.scrollToEnd({ animated: true });
  }, [isNoteFocused, keyboardHeight]);

  const loadLatest = async () => {
    setLoadingLatest(true);
    const outcome = await dispatch(loadLatestRecord());
    setLoadingLatest(false);

    if (outcome === 'failed') addAlert('Couldn’t load the latest version. Check your connection and try again.');
  };

  const saveLabel = isEdit ? 'Save changes' : isIncome ? 'Save income' : 'Save expense';

  return (
    <View style={[styles.root, { height }]}>
      <View style={styles.topBlock}>
        <View style={styles.handle} />

        <View style={styles.header}>
          {isEdit && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onBack}
              disabled={isSaving}
              activeOpacity={0.6}
              hitSlop={8}
              accessibilityLabel="Back to details"
            >
              <Icon name="back" size={14} color={colors.text} strokeWidth={2.1} />
            </TouchableOpacity>
          )}

          <Text style={styles.headerTitle}>{isEdit ? 'Edit transaction' : 'New transaction'}</Text>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            disabled={isSaving}
            activeOpacity={0.6}
            hitSlop={8}
            accessibilityLabel="Close"
          >
            <Icon name="close" size={14} color={colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.fields, isSaving && styles.fieldsLocked]} pointerEvents={isSaving ? 'none' : 'auto'}>
        <View style={styles.topFields}>
          <TypeToggle value={draft.transactionType} onChange={changeType} />

          <AmountField
            value={draft.amount}
            onChange={(amount) => change({ amount })}
            autoFocus={flow.view.name === 'create' && flow.view.focusAmount}
            typeColor={typeColor}
            isIncome={isIncome}
            currencyCode={currencyCode}
            error={amountError}
          />

          {limitForecast && (
            <View style={styles.limitHint}>
              <LimitHint forecast={limitForecast} currencyCode={currencyCode} />
            </View>
          )}
        </View>

        <BottomSheetScrollView
          ref={scrollRef}
          style={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <CategoryGrid
              tiles={grid.tiles}
              hasMore={grid.hasMore}
              selectedId={draft.categoryId}
              archivedId={archived?.id ?? null}
              typeColor={typeColor}
              emptyLabel={`No ${isIncome ? 'income' : 'expense'} categories yet`}
              onSelect={(categoryId) => change({ categoryId })}
              onMore={() => dispatch(categoriesOpened())}
              onCreate={onCreateCategory}
            />

            <WalletPicker
              wallets={wallets}
              hasDeletedWallet={hasDeletedWallet}
              selectedId={draft.walletId}
              hint={walletHint}
              typeColor={typeColor}
              onSelect={(walletId) => change({ walletId })}
              onCreate={onCreateWallet}
            />

            <DateChip timestamp={draft.timestamp} error={errors.timestamp} onPress={() => dispatch(dateTimeOpened())} />

            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionLabel}>Note</Text>
                <Text style={[styles.sectionHint, errors.description && styles.sectionHintError]}>
                  {draft.description ? `${descriptionLength(draft.description)}/${DESCRIPTION_MAX_LENGTH}` : 'optional'}
                </Text>
              </View>

              <BottomSheetTextInput
                style={styles.note}
                value={draft.description}
                onChangeText={(description) => change({ description })}
                onFocus={() => setNoteFocused(true)}
                onBlur={() => setNoteFocused(false)}
                placeholder="Add a note…"
                placeholderTextColor={colors.muted}
                multiline
                blurOnSubmit
                returnKeyType="done"
                accessibilityLabel="Note"
              />
            </View>
          </View>
        </BottomSheetScrollView>
      </View>

      <ActionRow
        label={saveLabel}
        helperText={helperText}
        ready={ready}
        isSaving={isSaving}
        isAboveKeyboard={keyboardHeight > 0}
        typeColor={typeColor}
        banner={
          hasConflict && (
            <FlowBanner
              tone="warn"
              title="This transaction was changed"
              text="Someone saved it after you opened it. Your edits are still here; loading the latest version replaces them."
              actionLabel="Load latest"
              isBusy={isLoadingLatest}
              onAction={loadLatest}
            />
          )
        }
        onPress={onSave}
      />
    </View>
  );
};

export default TransactionEditor;
