import { useMemo } from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';

import type { TransactionModel } from '@api/models';
import Icon from '@components/Icon/Icon';
import { useAppDispatch, useAppSelector, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { getActiveCategories } from '@redux/state/category/selectors';
import { useGetLimitsQuery } from '@redux/state/limit/api';
import { EMPTY_LIMITS, findLimitForCategory } from '@redux/state/limit/selectors';
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
import { useGetWalletsQuery } from '@redux/state/wallet/api';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';
import ActionRow from './ActionRow/ActionRow';
import AmountField from './AmountField/AmountField';
import CategoryGrid from './CategoryGrid/CategoryGrid';
import { buildCategoryGrid } from './CategoryGrid/categoryLayout';
import DateChip from './DateChip/DateChip';
import LimitHint from './LimitHint/LimitHint';
import TypeToggle from './TypeToggle/TypeToggle';
import useDefaultWallet from './useDefaultWallet';
import WalletPicker from './WalletPicker/WalletPicker';

import styles from './style';

export const EDITOR_HEIGHT_FRACTION = 0.86;

const isThisMonth = (timestamp: string, now: Date) => {
  const date = new Date(timestamp);

  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
};

// What an expense already adds to its limit's `spent` this month, so an edit replaces it instead of counting it twice.
const countedInLimit = (saved: TransactionModel | null, categoryId: number | null, now: Date) =>
  saved?.transactionType === TransactionType.EXPENSE &&
  saved.category.id === categoryId &&
  isThisMonth(saved.timestamp, now)
    ? Number(saved.amount)
    : 0;

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
  const spaceArg = useSpaceArg();
  const { currentData: walletsOverview } = useGetWalletsQuery(spaceArg);
  const { currentData: allCategories } = useGetCategoriesQuery(spaceArg);
  const { categoryLimits } = useGetLimitsQuery(spaceArg).currentData ?? EMPTY_LIMITS;
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
  const archived = saved?.category.isArchived ? saved.category : null;

  useDefaultWallet(flow, activeWalletIds);

  const fitsType = (categoryId: number | null, type: TransactionType) =>
    categoryId !== null &&
    (activeOf(type).some(({ id }) => id === categoryId) ||
      (archived?.id === categoryId && archived.transactionType === type));

  const grid = buildCategoryGrid({
    active: activeOf(draft.transactionType),
    archived: archived?.transactionType === draft.transactionType ? archived : null,
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
    available: { walletIds: activeWalletIds },
  });
  const isChanged = hasUnsavedChanges(flow);
  const ready = !hasDraftErrors(errors) && (!isEdit || isChanged);
  const helperText = isEdit && !isChanged ? undefined : Object.values(errors)[0];

  const matchedLimit =
    !isIncome && draft.categoryId !== null && isThisMonth(draft.timestamp, now)
      ? findLimitForCategory(categoryLimits, draft.categoryId)
      : undefined;

  const walletName = wallets.find(({ id }) => id === draft.walletId)?.wallet_name;
  const hasDeletedWallet = isEdit && saved.wallet === null;
  const hasNoWallets = activeWalletIds?.length === 0;
  const walletHint = hasDeletedWallet
    ? hasNoWallets
      ? 'This wallet was deleted and you have no other wallets. Keep it, or create a new one to move the transaction.'
      : 'This wallet was deleted. You can keep it or move the transaction to another wallet.'
    : !isEdit && hasNoWallets
      ? 'Create a wallet to save this transaction.'
      : undefined;

  const saveLabel = isEdit ? 'Save changes' : isIncome ? 'Save income' : 'Save expense';

  return (
    <View style={[styles.root, { height: windowHeight * EDITOR_HEIGHT_FRACTION }]}>
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
            walletName={walletName}
          />

          {matchedLimit && (
            <View style={styles.limitHint}>
              <LimitHint
                limit={matchedLimit}
                amount={draft.amount}
                counted={countedInLimit(saved, draft.categoryId, now)}
                currencyCode={currencyCode}
              />
            </View>
          )}
        </View>

        <BottomSheetScrollView
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
        typeColor={typeColor}
        onPress={onSave}
      />
    </View>
  );
};

export default TransactionEditor;
