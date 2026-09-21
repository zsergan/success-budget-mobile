import { Text, TouchableOpacity, View } from 'react-native';

import type { LimitModel } from '@api/models';
import { Icon, ModalContainer } from '@components';
import { useAppDispatch } from '@redux/hooks';
import { removeLimit } from '@redux/state/limit/thunks';
import { formatCurrencyAmount } from '@shared/utils';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  limit: LimitModel | undefined;
  currencyCode?: string;
  onClose: () => void;
}

const DeleteLimitDialog = ({ limit, currencyCode, onClose }: Props) => {
  const dispatch = useAppDispatch();

  const handleDelete = () => {
    if (!limit) return;

    dispatch(removeLimit(limit.id));
    onClose();
  };

  const isGroup = (limit?.categories.length ?? 0) > 1;
  const limitName = limit?.name ?? limit?.categories[0]?.name ?? 'monthly total';
  const description = limit?.categories.length
    ? `Only the threshold goes away. Your transactions in ${limit.categories.map((category) => category.name).join(', ')} stay untouched and keep counting towards the monthly total.`
    : 'Only the threshold goes away. Every expense keeps being recorded exactly as before.';

  return (
    <ModalContainer isVisible={!!limit} onClose={onClose} animationType="fade">
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

          <View style={styles.actions}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
              <Text style={styles.deleteButtonText}>Delete limit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.keepButton} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.keepButtonText}>Keep it</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ModalContainer>
  );
};

export default DeleteLimitDialog;
