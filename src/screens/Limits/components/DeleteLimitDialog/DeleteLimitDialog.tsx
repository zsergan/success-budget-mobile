import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import type { LimitModel } from '@api/models';
import { Icon, ModalContainer } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import type { ConfirmAction } from '@hooks';
import { useDeleteLimitMutation } from '@redux/state/limit/api';
import { formatCurrencyAmount } from '@shared/utils';

import createStyles from './style';

interface Props {
  deletion: ConfirmAction<LimitModel>;
  currencyCode?: string;
}

const DeleteLimitDialog = ({ deletion, currencyCode }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const { target: limit, isPending, error, cancel, confirm } = deletion;
  const [deleteLimit] = useDeleteLimitMutation();

  const handleDelete = () => {
    confirm((target, spaceId) => deleteLimit({ spaceId, limitId: target.id }));
  };

  const isGroup = (limit?.categories.length ?? 0) > 1;
  const limitName = limit?.name ?? limit?.categories[0]?.name ?? 'monthly total';
  const description = limit?.categories.length
    ? `Only the threshold goes away. Your transactions in ${limit.categories.map((category) => category.name).join(', ')} stay untouched and keep counting towards the monthly total.`
    : 'Only the threshold goes away. Every expense keeps being recorded exactly as before.';

  return (
    <ModalContainer isVisible={!!limit} onClose={cancel} animationType="fade">
      {limit && (
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Icon name="trash" size={27} color={colors.danger} strokeWidth={1.7} />
          </View>

          <Text style={styles.title}>{`Delete the «${limitName}» limit?`}</Text>

          <Text style={styles.description}>{description}</Text>

          <View style={styles.preview}>
            <View style={styles.previewIconBox}>
              {isGroup ? (
                limit.categories
                  .slice(0, 4)
                  .map((category) => <Icon key={category.id} name={category.icon} size={14} color={colors.text} />)
              ) : (
                <Icon name={limit.categories[0]?.icon ?? 'limit'} size={18} color={colors.text} />
              )}
            </View>

            <View style={styles.previewText}>
              <Text style={styles.previewName}>{limitName}</Text>

              <Text style={styles.previewAmount}>
                {`${formatCurrencyAmount(limit.spent, currencyCode)} of ${formatCurrencyAmount(Number(limit.amount), currencyCode)} this month`}
              </Text>
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={isPending}
              activeOpacity={0.8}
            >
              {isPending && <ActivityIndicator size="small" color={colors.onDanger} />}

              <Text style={styles.deleteButtonText}>{isPending ? 'Deleting…' : 'Delete limit'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.keepButton, isPending && styles.buttonDisabled]}
              onPress={cancel}
              disabled={isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.keepButtonText}>Keep it</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ModalContainer>
  );
};

export default DeleteLimitDialog;
