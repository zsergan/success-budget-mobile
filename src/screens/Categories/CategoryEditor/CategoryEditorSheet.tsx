import { Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Controller } from 'react-hook-form';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { Icon } from '@components';
import type { CategoryModel } from '@api/models';
import { toBackendIcon } from '@api/models';
import { TransactionType } from '@shared/enums';
import { CATEGORY_COLOR_NAMES } from '@shared/categoryColors';
import { colors } from '@shared/theme';
import CategoryIconBox from '../CategoryIconBox/CategoryIconBox';
import ColorPicker from './ColorPicker';
import IconPicker from './IconPicker';
import useCategoryEditorForm, { NAME_MAX_LENGTH } from './useCategoryEditorForm';

import styles from './style';

export const CATEGORY_EDITOR_SNAP_POINT = '94%';

const TYPE_LABEL: Record<TransactionType, string> = {
  [TransactionType.EXPENSE]: 'Expense',
  [TransactionType.INCOME]: 'Income',
};

interface Props {
  category?: CategoryModel;
  defaultTransactionType?: TransactionType;
  onRequestDelete?: (category: CategoryModel) => void;
}

const CategoryEditorSheet = ({ category, defaultTransactionType, onRequestDelete }: Props) => {
  const { height: windowHeight } = useWindowDimensions();
  const { isNewCategory, control, watch, onSubmit, isSubmitDisabled } = useCategoryEditorForm({
    category,
    defaultTransactionType,
  });

  const name = watch('name');
  const transactionType = watch('transactionType');
  const icon = watch('icon');
  const color = watch('color');

  const transactionCount = category?.transactionCount ?? 0;
  const countText =
    transactionCount === 0
      ? 'No transactions yet'
      : `${transactionCount} transaction${transactionCount === 1 ? '' : 's'}`;

  const previewSub = isNewCategory
    ? `${TYPE_LABEL[transactionType]} · ${CATEGORY_COLOR_NAMES[color]} · ${toBackendIcon(icon)} icon`
    : `${TYPE_LABEL[transactionType]} · ${countText}${category?.limit ? ` · in «${category.limit.name ?? 'group'}» limit` : ''}`;

  return (
    <View style={[styles.root, { height: windowHeight * parseFloat(CATEGORY_EDITOR_SNAP_POINT) * 0.01 }]}>
      <View style={styles.topBlock}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>{isNewCategory ? 'New category' : 'Edit category'}</Text>
        </View>

        <View style={styles.preview}>
          <CategoryIconBox icon={icon} color={color} size={56} />

          <View style={styles.previewText}>
            <Text style={styles.previewName} numberOfLines={1}>
              {name || 'New category'}
            </Text>

            <Text style={styles.previewSub} numberOfLines={1}>
              {previewSub}
            </Text>
          </View>
        </View>
      </View>

      <BottomSheetScrollView
        style={styles.body}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Name</Text>

          <Controller
            name="name"
            control={control}
            render={({ field: { onChange, value, onBlur }, fieldState: { isTouched } }) => (
              <View style={[styles.nameField, isTouched && styles.nameFieldFocused]}>
                <TextInput
                  style={styles.nameInput}
                  value={value}
                  onChangeText={(text) => onChange(text.slice(0, NAME_MAX_LENGTH))}
                  onBlur={onBlur}
                  placeholder="My category"
                  placeholderTextColor={colors.muted}
                  maxLength={NAME_MAX_LENGTH}
                  returnKeyType="done"
                />

                <Text style={styles.nameCount}>
                  {value.length}/{NAME_MAX_LENGTH}
                </Text>
              </View>
            )}
          />
        </View>

        {isNewCategory ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Type</Text>

            <Controller
              name="transactionType"
              control={control}
              render={({ field: { onChange, value } }) => (
                <View style={styles.typeSwitch}>
                  {([TransactionType.EXPENSE, TransactionType.INCOME] as const).map((type) => {
                    const active = value === type;

                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeTab, active && styles.typeTabActive]}
                        onPress={() => onChange(type)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name={type === TransactionType.EXPENSE ? 'expense' : 'income'}
                          size={15}
                          color={active ? colors.text : colors.muted}
                          strokeWidth={2.1}
                        />

                        <Text style={[styles.typeTabText, { color: active ? colors.text : colors.muted }]}>
                          {TYPE_LABEL[type]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />

            <View style={styles.typeHint}>
              <Icon name="alert" size={14} color={colors.warn} strokeWidth={1.9} />

              <Text style={styles.typeHintText}>
                Set once. After saving you can rename this category, change its icon and colour — but never switch it
                between expense and income.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.lockedLabelRow}>
              <Text style={styles.sectionLabel}>Type</Text>

              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>LOCKED</Text>
              </View>
            </View>

            <View style={styles.lockedBox}>
              <Icon name="lock" size={18} color={colors.muted} strokeWidth={1.8} />

              <Text style={styles.lockedBoxText}>{TYPE_LABEL[transactionType]}</Text>
            </View>

            <View style={styles.typeHint}>
              <Icon name="alert" size={14} color={colors.muted} strokeWidth={1.9} />

              <Text style={styles.typeHintText}>
                {transactionCount === 0
                  ? 'No transactions are filed under this category yet, but its type still stays fixed — create a new category instead if you need the other type.'
                  : `${transactionCount} transaction${transactionCount === 1 ? ' is' : 's are'} already filed as ${transactionType === TransactionType.EXPENSE ? 'expenses' : 'income'} under this category. Flipping the type would rewrite their sign, so it stays fixed — create a new ${transactionType === TransactionType.EXPENSE ? 'income' : 'expense'} category instead.`}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Colour</Text>

          <Controller
            name="color"
            control={control}
            render={({ field: { onChange, value } }) => <ColorPicker value={value} onChange={onChange} />}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Icon</Text>
            <Text style={styles.iconNote}>35 icons · Stage 2 set</Text>
          </View>

          <Controller
            name="icon"
            control={control}
            render={({ field: { onChange, value } }) => <IconPicker value={value} color={color} onChange={onChange} />}
          />
        </View>

        {!isNewCategory && category && onRequestDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => onRequestDelete(category)} activeOpacity={0.7}>
            <Icon name="trash" size={16} color={colors.danger} strokeWidth={1.9} />
            <Text style={styles.deleteButtonText}>Delete category</Text>
          </TouchableOpacity>
        )}
      </BottomSheetScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSubmitDisabled && styles.saveButtonDisabled]}
          onPress={onSubmit}
          disabled={isSubmitDisabled}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveButtonText, isSubmitDisabled && styles.saveButtonTextDisabled]}>
            {isNewCategory ? 'Create category' : 'Save changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CategoryEditorSheet;
