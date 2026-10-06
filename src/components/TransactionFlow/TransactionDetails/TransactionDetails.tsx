import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import type { TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import Icon from '@components/Icon/Icon';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import type { TransactionFlow } from '@redux/state/transactionFlow/slice';
import { editStarted } from '@redux/state/transactionFlow/slice';
import { checkFlowRecord } from '@redux/state/transactionFlow/thunks';
import { TransactionType } from '@shared/enums';
import theme, { colors } from '@shared/theme';
import { formatAmount, hexToRgba } from '@shared/utils';
import FlowBanner from '../FlowBanner/FlowBanner';
import { formatDateTime } from '../format';

import styles from './style';

interface Props {
  flow: TransactionFlow & { saved: TransactionModel };
  onClose: () => void;
}

// Shows the record the list had at once; Edit waits until it is read again, so it never starts from an old version.
const TransactionDetails = ({ flow: { saved: transaction, check }, onClose }: Props) => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

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
        <>
          {check === 'failed' && (
            <FlowBanner
              tone="danger"
              text="Couldn’t load the latest version. Check your connection and try again."
              actionLabel="Try again"
              onAction={() => dispatch(checkFlowRecord())}
            />
          )}

          <TouchableOpacity
            style={[styles.editButton, check !== 'done' && styles.buttonLocked]}
            onPress={() => dispatch(editStarted())}
            disabled={check !== 'done'}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: check !== 'done', busy: check === 'pending' }}
          >
            {check === 'pending' ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Icon name="edit" size={16} color={colors.text} strokeWidth={1.9} />
            )}
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default TransactionDetails;
