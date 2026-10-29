import type { Confirmation } from '@components';
import { nameOr } from '@components/Toast/message';
import { CategoryIconBox, ConfirmationObject, ConfirmationSheet } from '@components';
import type { ConfirmAction } from '@hooks';
import type { CategoryModel } from '@api/models';
import { useDeleteCategoryMutation } from '@redux/state/category/api';
import { TransactionType } from '@shared/enums';

const TYPE_LABEL: Record<TransactionType, string> = {
  [TransactionType.EXPENSE]: 'Expense',
  [TransactionType.INCOME]: 'Income',
};

const countText = (count: number) =>
  count === 0 ? 'no transactions' : `${count} transaction${count === 1 ? '' : 's'}`;

// Only group limits carry a name, and a limit is deleted along with its last category.
const limitConsequences = ({ name, limit }: CategoryModel, willDelete: boolean): Confirmation['consequences'] => {
  if (!limit) return undefined;
  if (!limit.name) {
    return {
      tone: 'danger',
      title: 'Its limit is deleted too',
      items: ['This category has a limit of its own, and the limit goes away with it.'],
    };
  }

  return {
    tone: 'warn',
    title: `Excluded from the “${limit.name}” limit`,
    items: [
      `${name} is removed from the categories this limit tracks; the limit keeps its others.`,
      'If it was the limit’s last category, the limit is deleted.',
      ...(willDelete ? [] : ['Spending already logged here stays in this month’s total.']),
    ],
  };
};

interface Props {
  deletion: ConfirmAction<CategoryModel>;
}

// A category without transactions is deleted; one with history is archived instead, by the same request. The copy
// follows the cached count, but what happened comes from the answer: the count may be out of date.
const DeleteCategoryDialog = ({ deletion }: Props) => {
  const { target: category, isPending, error, cancel, confirm } = deletion;
  const [deleteCategory] = useDeleteCategoryMutation();

  const confirmation = (target: CategoryModel): Confirmation => {
    const willDelete = target.transactionCount === 0;
    const run = () =>
      confirm(
        (category, spaceId) => deleteCategory({ spaceId, categoryId: category.id }),
        ({ archived }, category) => ({
          tone: 'success',
          text: `${nameOr(category.name, 'Category')} ${archived ? 'archived' : 'deleted'}`,
        }),
      );

    return {
      title: willDelete ? `Delete “${target.name}”?` : `Archive “${target.name}”?`,
      description: willDelete
        ? 'Nothing is filed under this category yet, so it is removed completely.'
        : 'Past transactions use this category, so it is archived instead of deleted. It leaves the category picker; those transactions keep showing it as it is. It stays in Categories under Archived.',
      context: willDelete ? undefined : (
        <ConfirmationObject
          icon={<CategoryIconBox icon={target.icon} color={target.color} size={40} />}
          name={target.name}
          meta={`${TYPE_LABEL[target.transactionType]} category · ${countText(target.transactionCount)}`}
        />
      ),
      consequences: limitConsequences(target, willDelete),
      primaryAction: willDelete
        ? { label: 'Delete category', tone: 'danger', busyLabel: 'Deleting…', onPress: run }
        : { label: 'Archive category', busyLabel: 'Archiving…', onPress: run },
      onCancel: cancel,
      isPending,
      message: error ? { text: error } : undefined,
    };
  };

  return <ConfirmationSheet confirmation={category ? confirmation(category) : null} />;
};

export default DeleteCategoryDialog;
