import { Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Controller } from 'react-hook-form';

import type { LimitModel } from '@api/models';
import { Icon } from '@components';
import { useAppSelector } from '@redux/hooks';
import { selectActiveCategories } from '@redux/state/category/selectors';
import { findLimitForCategory, selectLimit } from '@redux/state/limit/selectors';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import { formatCurrencyAmount, hexToRgba } from '@shared/utils';
import theme, { colors } from '@shared/theme';
import type { LimitScope } from './types';
import { getCommittedTotal, isOverCommitted } from './allocation';
import useLimitEditorForm from './useLimitEditorForm';

import styles from './style';

const SCOPES: { value: LimitScope; label: string }[] = [
  { value: 'category', label: 'One category' },
  { value: 'group', label: 'Group' },
  { value: 'total', label: 'Monthly total' },
];

const ALLOCATION_COLORS = [colors.accent, '#8a5406', colors.ok, colors.muted];

// Must match the snapPoint passed to the BottomModal wrapping this sheet in LimitsScreen.tsx.
export const LIMIT_EDITOR_SNAP_POINT = '94%';
const SNAP_FRACTION = parseFloat(LIMIT_EDITOR_SNAP_POINT) / 100;

interface Props {
  limit?: LimitModel;
  initialScope?: LimitScope;
  onRequestDelete?: (limit: LimitModel) => void;
}

const LimitEditorSheet = ({ limit, initialScope, onRequestDelete }: Props) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { expenses } = useAppSelector(selectActiveCategories);
  const { total, categoryLimits } = useAppSelector(selectLimit);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  const { control, watch, setScope, toggleCategory, onNameChange, onSubmit, isSubmitDisabled, closeBottomSheet } =
    useLimitEditorForm({ limit, initialScope });

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

        <View style={styles.scopeSwitch}>
          {SCOPES.map((item) => {
            const active = scope === item.value;

            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.scopeTab, active && styles.scopeTabActive]}
                onPress={() => setScope(item.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.scopeTabText, active && styles.scopeTabTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <BottomSheetScrollView
        style={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {isGroup && (
            <View style={styles.nameSection}>
              <Text style={styles.sectionLabel}>Limit name</Text>

              <View style={styles.nameBox}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field: { value } }) => (
                    <TextInput style={styles.nameInput} value={value} onChangeText={onNameChange} />
                  )}
                />

                <Text style={styles.nameHint}>auto from categories</Text>
              </View>
            </View>
          )}

          <View style={styles.hero}>
            <Text style={styles.heroLabel}>{isTotal ? 'All expenses this month' : 'Monthly limit'}</Text>

            <View style={styles.heroRow}>
              <Controller
                name="amount"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    inputMode="decimal"
                    style={styles.heroAmount}
                    returnKeyType="done"
                  />
                )}
              />

              {currencyCode && <Text style={styles.heroCurrency}>{currencyCode}</Text>}
            </View>

            <Text style={styles.heroSub}>
              {isTotal ? 'Cap for every expense across all wallets' : 'Counted across all wallets together'}
            </Text>
          </View>

          {isEdit && limit && limit.spent > 0 && (
            <View style={styles.spentContext}>
              <Icon name="info" size={16} color={colors.muted} strokeWidth={1.9} />

              <Text style={styles.spentContextText}>
                {`${formatCurrencyAmount(limit.spent, currencyCode)} already spent this month — editing moves the threshold only, history stays.`}
              </Text>
            </View>
          )}

          {!isTotal && (
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionLabel}>{isGroup ? 'Categories in this limit' : 'Category'}</Text>

                <Text style={styles.sectionHint}>{`${categoryIds.length} selected`}</Text>
              </View>

              <View style={styles.categoryGrid}>
                {expenses.map((category) => {
                  const selected = categoryIds.includes(category.id);
                  const taken = claimedElsewhere.has(category.id);

                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.categoryCell}
                      onPress={() => !taken && toggleCategory(category.id, namesById)}
                      disabled={taken}
                      activeOpacity={0.6}
                    >
                      <View
                        style={[
                          styles.categoryIconBox,
                          selected && { backgroundColor: hexToRgba(colors.accent, 0.12), borderColor: colors.accent },
                        ]}
                      >
                        <Icon
                          name={category.icon}
                          size={22}
                          color={selected ? colors.accent : taken ? colors.muted : colors.text}
                        />

                        {selected && (
                          <View style={styles.selectedBadge}>
                            <Icon name="check" size={10} color={colors.onAccent} strokeWidth={3.4} />
                          </View>
                        )}

                        {taken && !selected && (
                          <View style={styles.takenBadge}>
                            <Icon name="minus" size={9} color={colors.muted} strokeWidth={3} />
                          </View>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.categoryName,
                          selected && styles.categoryNameSelected,
                          taken && styles.categoryNameTaken,
                        ]}
                        numberOfLines={2}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {isGroup && claimedElsewhere.size > 0 && (
                <Text style={styles.takenHint}>Greyed-out categories already belong to another limit.</Text>
              )}
            </View>
          )}

          {isTotal && categoryLimits.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionLabel}>Already committed to categories</Text>

                <Text style={[styles.sectionHint, overCommitted && { color: colors.warn }]}>
                  {formatCurrencyAmount(committedTotal, currencyCode)}
                </Text>
              </View>

              <View style={styles.allocationBar}>
                {categoryLimits.map((categoryLimit, index) => (
                  <View
                    key={categoryLimit.id}
                    style={{
                      flex: Number(categoryLimit.amount),
                      height: 10,
                      backgroundColor: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
                    }}
                  />
                ))}
              </View>

              {categoryLimits.map((categoryLimit, index) => (
                <View key={categoryLimit.id} style={styles.allocationRow}>
                  <View
                    style={[
                      styles.allocationDot,
                      { backgroundColor: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] },
                    ]}
                  />

                  <Text style={styles.allocationName}>{categoryLimit.name ?? categoryLimit.categories[0]?.name}</Text>

                  <Text style={styles.allocationAmount}>
                    {formatCurrencyAmount(Number(categoryLimit.amount), currencyCode)}
                  </Text>
                </View>
              ))}

              {overCommitted && total && (
                <Text style={styles.takenHint}>
                  {`Categories currently commit ${formatCurrencyAmount(committedTotal, currencyCode)} — ${formatCurrencyAmount(committedTotal - Number(total.amount), currencyCode)} above this total. Raising it makes both numbers agree.`}
                </Text>
              )}
            </View>
          )}
        </View>
      </BottomSheetScrollView>

      <View style={[styles.footer, { marginBottom: theme.spacing.xl + insets.bottom }]}>
        <View style={styles.resetNote}>
          <Icon name="refresh" size={15} color={colors.muted} strokeWidth={1.9} />

          <Text style={styles.resetNoteText}>Resets on the 1st of every month · no rollover</Text>
        </View>

        <View style={styles.footerRow}>
          {isEdit && limit && onRequestDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                closeBottomSheet();
                onRequestDelete(limit);
              }}
              activeOpacity={0.7}
              hitSlop={4}
            >
              <Icon name="trash" size={19} color={colors.danger} strokeWidth={1.8} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.saveButton, ready && styles.saveButtonReady]}
            onPress={onSubmit}
            disabled={!ready || isSubmitDisabled}
            activeOpacity={0.8}
          >
            {ready && <Icon name="check" size={17} color="#FFFDFA" strokeWidth={2.4} />}

            <Text style={[styles.saveButtonText, ready && styles.saveButtonTextReady]}>
              {isEdit ? 'Save changes' : isTotal ? 'Set monthly total' : 'Create limit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default LimitEditorSheet;
