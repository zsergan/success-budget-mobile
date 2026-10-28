import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import type { TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import type { TransactionFlow } from '@redux/state/transactionFlow/slice';
import { editStarted } from '@redux/state/transactionFlow/slice';
import { checkFlowRecord, loadLatestRecord } from '@redux/state/transactionFlow/thunks';
import { TransactionType } from '@shared/enums';
import theme from '@shared/theme';
import { formatAmount, formatMoneyAmount, hexToRgba } from '@shared/utils';
import DeleteButton from '../DeleteButton/DeleteButton';
import { deleteFailureAction, deleteFailureText } from '../deleteMessage';
import Banner from '@components/Banner/Banner';
import { formatDateTime } from '../format';

import createStyles from './style';

interface Props {
  flow: TransactionFlow & { saved: TransactionModel };
  onClose: () => void;
  onDelete: () => void;
  onRetryDelete: () => void;
}

// Shows the record the list had at once; Edit and Delete wait until it is read again, so neither acts on an old
// version.
const TransactionDetails = ({
  flow: { saved: transaction, check, notice, isSaving },
  onClose,
  onDelete,
  onRetryDelete,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const [isLoadingLatest, setLoadingLatest] = useState(false);
  const canAct = check === 'done' && notice !== 'conflict' && !isSaving;

  const loadLatest = async () => {
    setLoadingLatest(true);
    await dispatch(loadLatestRecord());
    setLoadingLatest(false);
  };

  const isSystem = isInitialBalance(transaction);
  const isIncome = transaction.transactionType === TransactionType.INCOME;
  const typeColor = isSystem ? colors.text : isIncome ? colors.ok : colors.danger;

  return (
    <View style={[styles.root, { paddingBottom: theme.spacing.xl + insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          disabled={isSaving}
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

          <Text
            style={[styles.amount, { color: typeColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {isSystem
              ? formatMoneyAmount(transaction.amount, currencyCode)
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
          {check === 'failed' ? (
            <Banner
              tone="warn"
              title="This may not be the latest version"
              text="Couldn’t check it with the server. Edit and Delete come back once it’s checked."
              actionLabel="Try again"
              onAction={() => dispatch(checkFlowRecord())}
            />
          ) : notice === 'conflict' ? (
            <Banner
              tone="warn"
              title="This transaction was changed"
              text="Someone saved it after you opened it. Load the latest version before you edit or delete it."
              actionLabel="Load latest"
              isBusy={isLoadingLatest}
              onAction={loadLatest}
            />
          ) : notice === 'saveFound' ? (
            <Banner
              tone="success"
              title="Already saved"
              text="An earlier attempt saved this transaction, so it wasn’t added twice."
            />
          ) : (
            (notice === 'deleteFailed' || notice === 'deleteUncertain') && (
              <Banner
                tone="danger"
                text={deleteFailureText(notice, 'delete')}
                actionLabel={deleteFailureAction(notice)}
                onAction={onRetryDelete}
              />
            )
          )}

          <TouchableOpacity
            style={[styles.editButton, !canAct && styles.buttonLocked]}
            onPress={() => dispatch(editStarted())}
            disabled={!canAct}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canAct, busy: check === 'pending' }}
          >
            {check === 'pending' ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Icon name="edit" size={16} color={colors.text} strokeWidth={1.9} />
            )}
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <DeleteButton isDeleting={isSaving} disabled={!canAct} onPress={onDelete} />
        </>
      )}
    </View>
  );
};

export default TransactionDetails;
