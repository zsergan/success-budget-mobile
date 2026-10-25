import { View } from 'react-native';

import type { LimitModel } from '@api/models';
import type { Confirmation } from '@components';
import { CategoryIconBox, ConfirmationObject, ConfirmationSheet, Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import type { ConfirmAction } from '@hooks';
import { useDeleteLimitMutation } from '@redux/state/limit/api';
import { formatCurrencyAmount } from '@shared/utils';

import createStyles from './style';

const TILE_SIZE = 40;

interface Props {
  deletion: ConfirmAction<LimitModel>;
  currencyCode?: string;
}

const DeleteLimitDialog = ({ deletion, currencyCode }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const { target: limit, isPending, error, cancel, confirm } = deletion;
  const [deleteLimit] = useDeleteLimitMutation();

  const tile = ({ categories }: LimitModel) => {
    if (categories.length === 1) {
      const [category] = categories;
      return <CategoryIconBox icon={category.icon} color={category.color} size={TILE_SIZE} />;
    }

    return (
      <View style={styles.tile}>
        {categories.length === 0 ? (
          <Icon name="limit" size={18} color={colors.text} />
        ) : (
          categories
            .slice(0, 4)
            .map((category) => <Icon key={category.id} name={category.icon} size={14} color={colors.text} />)
        )}
      </View>
    );
  };

  const confirmation = (target: LimitModel): Confirmation => {
    const name = target.name ?? target.categories[0]?.name;

    return {
      title: name ? `Delete the “${name}” limit?` : 'Delete the monthly total limit?',
      description: target.categories.length
        ? `Only the threshold goes away. Your transactions in ${target.categories.map((category) => category.name).join(', ')} stay untouched and keep counting towards the monthly total.`
        : 'Only the threshold goes away. Every expense keeps being recorded exactly as before.',
      context: (
        <ConfirmationObject
          icon={tile(target)}
          name={name ?? 'Monthly total'}
          meta={`${formatCurrencyAmount(target.spent, currencyCode)} of ${formatCurrencyAmount(Number(target.amount), currencyCode)} this month`}
        />
      ),
      primaryAction: {
        label: 'Delete limit',
        tone: 'danger',
        busyLabel: 'Deleting…',
        onPress: () => confirm((limit, spaceId) => deleteLimit({ spaceId, limitId: limit.id })),
      },
      onCancel: cancel,
      isPending,
      message: error ? { text: error } : undefined,
    };
  };

  return <ConfirmationSheet confirmation={limit ? confirmation(limit) : null} />;
};

export default DeleteLimitDialog;
