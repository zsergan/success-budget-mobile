import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import type { TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import Icon from '@components/Icon/Icon';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import { useGetTransactionQuery } from '@redux/state/transaction/api';
import { editStarted } from '@redux/state/transactionFlow/slice';
import { TransactionType } from '@shared/enums';
import theme, { colors } from '@shared/theme';
import { formatAmount, hexToRgba } from '@shared/utils';
import { formatDateTime } from '../format';

import styles from './style';

interface Props {
  spaceId: number;
  saved: TransactionModel;
  onClose: () => void;
}

// Reads the record again, so Edit starts from the version on the server rather than the one the list had.
const TransactionDetails = ({ spaceId, saved, onClose }: Props) => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const { currentData } = useGetTransactionQuery({ spaceId, transactionId: saved.id });
  const transaction = currentData && currentData.version >= saved.version ? currentData : saved;

  const isSystem = isInitialBalance(transaction);
  const isIncome = transaction.transactionType === TransactionType.INCOME;
  const typeColor = isSystem ? colors.text : isIncome ? colors.ok : colors.danger;

  return (
    <View style={[styles.root, { paddingBottom: theme.spacing.xl + insets.bottom }]}>
      <View style={styles.handle} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.6}
          hitSlop={8}
          accessibilityLabel="Close"
        >
          <Icon name="close" size={14} color={colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView style={styles.scroll} contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: isSystem ? colors.track : hexToRgba(typeColor, 0.12) }]}>
            <Icon name={isSystem ? 'wallet' : transaction.category.icon} size={26} color={typeColor} />
          </View>

          <Text style={styles.category} numberOfLines={2}>
            {transaction.category.name}
          </Text>

          <Text style={[styles.amount, { color: typeColor }]}>
            {isSystem
              ? formatAmount(transaction.amount, TransactionType.INCOME, currencyCode)
              : formatAmount(transaction.amount, transaction.transactionType, currencyCode)}
          </Text>

          <View style={[styles.typeChip, { backgroundColor: isSystem ? colors.track : hexToRgba(typeColor, 0.1) }]}>
            <Text style={[styles.typeChipText, { color: typeColor }]}>
              {isSystem ? 'Starting balance' : isIncome ? 'Income' : 'Expense'}
            </Text>
          </View>
        </View>

        {transaction.description && (
          <View style={styles.card}>
            <Text style={styles.description}>{transaction.description}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.property}>
            <Text style={styles.propertyLabel}>Wallet</Text>
            <Text style={[styles.propertyValue, !transaction.wallet && styles.propertyValueMuted]} numberOfLines={1}>
              {transaction.wallet?.wallet_name ?? 'Deleted wallet'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.property}>
            <Text style={styles.propertyLabel}>Date</Text>
            <Text style={styles.propertyValue}>{formatDateTime(transaction.timestamp)}</Text>
          </View>
        </View>
      </BottomSheetScrollView>

      {isSystem ? (
        <Text style={styles.systemNote}>Set when the wallet was created</Text>
      ) : (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => dispatch(editStarted({ transaction }))}
          activeOpacity={0.8}
        >
          <Icon name="edit" size={16} color={colors.text} strokeWidth={1.9} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TransactionDetails;
