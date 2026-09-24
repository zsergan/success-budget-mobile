import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import type { LimitModel } from '@api/models';
import { Icon } from '@components';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { getActiveCategories } from '@redux/state/category/selectors';
import { useGetLimitsQuery } from '@redux/state/limit/api';
import { EMPTY_LIMITS, findLimitForCategory } from '@redux/state/limit/selectors';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import { formatCurrencyAmount } from '@shared/utils';
import { colors } from '@shared/theme';
import type { LimitScope } from './types';
import { getCommittedTotal, isOverCommitted } from './allocation';
import ScopeSwitcher from './ScopeSwitcher/ScopeSwitcher';
import NameAmountFields from './NameAmountFields/NameAmountFields';
import CategoryPicker from './CategoryPicker/CategoryPicker';
import AllocationDisplay from './AllocationDisplay/AllocationDisplay';
import ActionRow from './ActionRow/ActionRow';
import useLimitEditorForm from './useLimitEditorForm';

import styles from './style';

// Must match the snapPoint passed to the BottomModal wrapping this sheet in LimitsScreen.tsx.
export const LIMIT_EDITOR_SNAP_POINT = '94%';
const SNAP_FRACTION = parseFloat(LIMIT_EDITOR_SNAP_POINT) / 100;

interface Props {
  limit?: LimitModel;
  initialScope?: LimitScope;
  onRequestDelete?: (limit: LimitModel) => void;
}

const LimitEditorSheet = ({ limit, initialScope, onRequestDelete }: Props) => {
  const { height: windowHeight } = useWindowDimensions();
  const spaceArg = useSpaceArg();
  const { currentData: categories } = useGetCategoriesQuery(spaceArg);
  const { expenses } = getActiveCategories(categories);
  const { total, categoryLimits } = useGetLimitsQuery(spaceArg).currentData ?? EMPTY_LIMITS;
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  const { control, watch, setScope, toggleCategory, onNameChange, onSubmit, isSubmitDisabled, closeBottomSheet } =
    useLimitEditorForm({
      limit,
      initialScope,
      activeCategoryIds: categories && expenses.map((category) => category.id),
    });

  const scope = watch('scope');
  const categoryIds = watch('categoryIds');
  const name = watch('name');
  const amount = watch('amount');

  const namesById = Object.fromEntries(expenses.map((category) => [category.id, category.name]));
  const claimedElsewhere = new Set(
    expenses
      .filter((category) => {
        const owner = findLimitForCategory(categoryLimits, category.id);

        return owner !== undefined && owner.id !== limit?.id;
      })
      .map((category) => category.id),
  );

  const selectedNames = categoryIds.map((id) => namesById[id]).filter(Boolean);
  const isEdit = !!limit;
  const sheetTitle =
    scope === 'total'
      ? 'Monthly total'
      : isEdit
        ? `Edit «${scope === 'group' ? name : selectedNames[0]}»`
        : 'New limit';

  const isTotal = scope === 'total';
  const isGroup = scope === 'group';
  const readyCategories = isTotal || categoryIds.length > 0;
  const readyName = !isGroup || name.trim().length > 0;
  const readyAmount = Number(amount.replace(',', '.')) > 0;
  const ready = readyCategories && readyName && readyAmount;

  const committedTotal = getCommittedTotal(categoryLimits);
  const overCommitted = isOverCommitted(committedTotal, total ?? undefined);

  const spentHint =
    isEdit && limit && limit.spent > 0
      ? `${formatCurrencyAmount(limit.spent, currencyCode)} already spent this month — editing moves the threshold only, history stays.`
      : undefined;

  return (
    <View style={[styles.root, { height: windowHeight * SNAP_FRACTION }]}>
      <View style={styles.topBlock}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {sheetTitle}
          </Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => closeBottomSheet()}
            activeOpacity={0.6}
            hitSlop={8}
          >
            <Icon name="close" size={14} color={colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
        </View>

        <ScopeSwitcher scope={scope} onScopeChange={setScope} />
      </View>

      <BottomSheetScrollView
        style={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <NameAmountFields
            control={control}
            isGroup={isGroup}
            isTotal={isTotal}
            currencyCode={currencyCode}
            onNameChange={onNameChange}
            spentHint={spentHint}
          />

          {!isTotal && (
            <CategoryPicker
              categories={expenses}
              categoryIds={categoryIds}
              claimedElsewhere={claimedElsewhere}
              isGroup={isGroup}
              onToggleCategory={(categoryId) => toggleCategory(categoryId, namesById)}
            />
          )}

          {isTotal && categoryLimits.length > 0 && (
            <AllocationDisplay
              categoryLimits={categoryLimits}
              committedTotal={committedTotal}
              overCommitted={overCommitted}
              total={total ?? undefined}
              currencyCode={currencyCode}
            />
          )}
        </View>
      </BottomSheetScrollView>

      <ActionRow
        onDeletePress={
          isEdit && limit && onRequestDelete
            ? () => {
                closeBottomSheet();
                onRequestDelete(limit);
              }
            : undefined
        }
        ready={ready}
        isSubmitDisabled={isSubmitDisabled}
        saveLabel={isEdit ? 'Save changes' : isTotal ? 'Set monthly total' : 'Create limit'}
        onSubmit={onSubmit}
      />
    </View>
  );
};

export default LimitEditorSheet;
