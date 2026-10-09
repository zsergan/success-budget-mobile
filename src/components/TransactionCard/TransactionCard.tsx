import { useRef } from 'react';
import { ActivityIndicator, Pressable, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import type { TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import { useAppSelector } from '@redux/hooks';
import { selectIsDeleting } from '@redux/state/transactionFlow/selectors';
import Icon from '../Icon/Icon';
import { formatAmount, formatDateHHMM, formatMoneyAmount } from '@shared/utils';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';

import styles from './style';

const DELETE_ACTION_TEXT_COLOR = '#FFFDFA';
const LARGE_FONT_SCALE = 1.3;

// One swiped row at a time across every list: opening another closes it.
let openRow: SwipeableMethods | null = null;

interface Props {
  transaction: TransactionModel;
  currencyCode?: string;
  isHighlighted?: boolean;
  onPress?: (transaction: TransactionModel) => void;
  // Swiping left offers Delete; `onSettled` slides the row back once the confirmation closes.
  onDelete?: (transaction: TransactionModel, onSettled: () => void) => void;
}

const TransactionCard = ({ transaction, currencyCode, isHighlighted = false, onPress, onDelete }: Props) => {
  const swipeRef = useRef<SwipeableMethods>(null);
  const isDeleting = useAppSelector((state) => selectIsDeleting(state, transaction.id));
  const isLargeText = useWindowDimensions().fontScale >= LARGE_FONT_SCALE;
  const isSystem = isInitialBalance(transaction);
  const isIncome = transaction.transactionType === TransactionType.INCOME && !isSystem;
  const { description, wallet } = transaction;

  // A row being deleted stays put, dimmed, until the server answers.
  const card = (
    <Pressable
      style={({ pressed }) => [
        styles.root,
        isHighlighted && styles.rootHighlighted,
        pressed && styles.rootPressed,
        isDeleting && styles.rootBusy,
      ]}
      onPress={onPress && (() => onPress(transaction))}
      disabled={!onPress || isDeleting}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ busy: isDeleting }}
    >
      <View
        style={[
          styles.iconBox,
          isSystem ? styles.iconBoxSystem : isIncome ? styles.iconBoxIncome : styles.iconBoxExpense,
        ]}
      >
        <Icon
          name={isSystem ? 'wallet' : transaction.category.icon}
          size={20}
          color={isIncome ? colors.ok : colors.text}
        />
      </View>

      <View style={styles.textColumn}>
        <View style={[styles.topLine, isLargeText && styles.lineStacked]}>
          <Text style={styles.category} numberOfLines={isLargeText ? 2 : 1}>
            {transaction.category.name}
          </Text>

          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.muted} />
          ) : (
            <Text style={[styles.amount, isIncome && styles.income]}>
              {isSystem
                ? formatMoneyAmount(transaction.amount, currencyCode)
                : formatAmount(transaction.amount, transaction.transactionType, currencyCode)}
            </Text>
          )}
        </View>

        {/* The time never shrinks; the description gives way first, then only a wallet name past its share. */}
        <View style={[styles.metaLine, isLargeText && styles.metaLineWrapped]}>
          {description && (
            <>
              <Text style={[styles.meta, styles.description]} numberOfLines={1}>
                {description}
              </Text>
              <Text style={[styles.meta, styles.fixed]}>{' · '}</Text>
            </>
          )}

          <Text
            style={[styles.meta, description ? styles.walletBeside : styles.walletAlone, !wallet && styles.metaFaint]}
            numberOfLines={1}
          >
            {wallet ? wallet.wallet_name : 'Deleted wallet'}
          </Text>

          <Text style={[styles.meta, styles.fixed]}>{` · ${formatDateHHMM(transaction.timestamp)}`}</Text>
        </View>
      </View>
    </Pressable>
  );

  if (!onDelete || isSystem) return card;

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      enabled={!isDeleting}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      childrenContainerStyle={styles.swipeContent}
      onSwipeableWillOpen={() => {
        if (openRow !== swipeRef.current) openRow?.close();
        openRow = swipeRef.current;
      }}
      onSwipeableClose={() => {
        if (openRow === swipeRef.current) openRow = null;
      }}
      renderRightActions={() => (
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => onDelete(transaction, () => swipeRef.current?.close())}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Delete"
        >
          <Icon name="trash" size={18} color={DELETE_ACTION_TEXT_COLOR} strokeWidth={2} />
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      )}
    >
      {card}
    </ReanimatedSwipeable>
  );
};

export default TransactionCard;
