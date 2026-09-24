import { ActivityIndicator, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { Icon } from '@components';
import ModalContainer from '@components/Modals/ModalContainer/ModalContainer';
import type { CategoryModel } from '@api/models';
import { useDeleteCategoryMutation } from '@redux/state/category/api';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';
import type { ConfirmAction } from '@hooks';

import styles from './style';

const TYPE_LABEL: Record<TransactionType, string> = {
  [TransactionType.EXPENSE]: 'Expense',
  [TransactionType.INCOME]: 'Income',
};

interface Props {
  deletion: ConfirmAction<CategoryModel>;
}

const DeleteCategoryDialog = ({ deletion }: Props) => {
  const { target: category, isPending, error, cancel, confirm } = deletion;
  const [deleteCategory] = useDeleteCategoryMutation();

  if (!category) {
    return null;
  }

  const willDelete = category.transactionCount === 0;

  const confirmColor = willDelete ? '#FFFDFA' : colors.onSecondary;
  const confirmLabel = willDelete ? 'Delete category' : 'Archive category';
  const pendingLabel = willDelete ? 'Deleting…' : 'Archiving…';

  const handleConfirm = () => {
    confirm((target, spaceId) => deleteCategory({ spaceId, categoryId: target.id }));
  };

  return (
    <ModalContainer isVisible={!!category} onClose={cancel} animationType="fade">
      <TouchableWithoutFeedback>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={[styles.iconBox, willDelete ? styles.iconBoxDelete : styles.iconBoxArchive]}>
              <Icon
                name={willDelete ? 'trash' : 'download'}
                size={23}
                color={willDelete ? colors.danger : colors.warn}
                strokeWidth={1.9}
              />
            </View>

            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={2}>
                {willDelete ? `Delete «${category.name}»?` : `«${category.name}» will be archived, not deleted`}
              </Text>

              <Text style={styles.subtitle}>
                {TYPE_LABEL[category.transactionType]} category ·{' '}
                {category.transactionCount === 0
                  ? 'no transactions'
                  : `${category.transactionCount} transaction${category.transactionCount === 1 ? '' : 's'}`}
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            {willDelete
              ? 'Nothing is filed under this category yet, so it can be removed completely. It disappears from the picker and from this list right away.'
              : `${category.transactionCount} transactions already reference this category. Deleting it would rewrite your history, so the category is archived instead: it leaves the picker when you add a transaction, and every past transaction keeps showing «${category.name}» exactly as it is.`}
          </Text>

          {!willDelete && category.limit && (
            <View style={styles.noticeBox}>
              <Icon name="limit" size={17} color={colors.warn} strokeWidth={1.9} />

              <View style={styles.noticeText}>
                <Text style={styles.noticeTitle}>Excluded from the «{category.limit.name ?? 'group'}» limit</Text>

                <Text style={styles.noticeBody}>
                  The «{category.limit.name ?? 'group'}» limit will no longer count transactions from this category.
                  Spending already logged here stays in this month&apos;s total.
                </Text>
              </View>
            </View>
          )}

          {!willDelete && (
            <View style={styles.footnoteRow}>
              <Icon name="refresh" size={14} color={colors.muted} strokeWidth={1.9} />

              <Text style={styles.footnoteText}>
                Find it any time under Categories → Archived and restore it with one tap.
              </Text>
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: willDelete ? colors.danger : colors.secondary }]}
              onPress={handleConfirm}
              disabled={isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={confirmColor} />
              ) : (
                <Icon name={willDelete ? 'trash' : 'download'} size={16} color={confirmColor} strokeWidth={2} />
              )}

              <Text style={[styles.confirmButtonText, { color: confirmColor }]}>
                {isPending ? pendingLabel : confirmLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, isPending && styles.buttonDisabled]}
              onPress={cancel}
              disabled={isPending}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ModalContainer>
  );
};

export default DeleteCategoryDialog;
