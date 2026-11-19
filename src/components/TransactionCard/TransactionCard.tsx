import { useRef } from 'react';
import { ActivityIndicator, Pressable, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import type { TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { useAppSelector } from '@redux/hooks';
import { selectProfileId } from '@redux/state/profile/selectors';
import { selectIsPersonalSpace } from '@redux/state/space/selectors';
import { selectIsDeleting } from '@redux/state/transactionFlow/selectors';
import Icon from '../Icon/Icon';
import { assignmentLabel, formatAmount, formatDateHHMM, formatMoneyAmount, isOwnAssignment } from '@shared/utils';
import { TransactionType } from '@shared/enums';

import createStyles from './style';

const LARGE_FONT_SCALE = 1.3;

// One swiped row at a time across every list: opening another closes it.
let openRow: SwipeableMethods | null = null;

interface Props {
  transaction: TransactionModel;
  currencyCode?: string;
  isHighlighted?: boolean;
  // The zone the time is told in; the device's when left out.
  timeZone?: string;
  // Home's hidden amounts: the row says what it is, not how much.
  isAmountHidden?: boolean;
  onPress?: (transaction: TransactionModel) => void;
  // Swiping left offers Delete; `onSettled` slides the row back once the confirmation closes.
  onDelete?: (transaction: TransactionModel, onSettled: () => void) => void;
}

const TransactionCard = ({
  transaction,
  currencyCode,
  isHighlighted = false,
  timeZone,
  isAmountHidden = false,
  onPress,
  onDelete,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const swipeRef = useRef<SwipeableMethods>(null);
  const isDeleting = useAppSelector((state) => selectIsDeleting(state, transaction.id));
  const isLargeText = useWindowDimensions().fontScale >= LARGE_FONT_SCALE;
  const isSystem = isInitialBalance(transaction);
  const isIncome = transaction.transactionType === TransactionType.INCOME && !isSystem;
  const selfId = useAppSelector(selectProfileId);
  const isPersonal = useAppSelector(selectIsPersonalSpace);
  const { description, assignment, author } = transaction;
  const isPersonGone = assignment.kind === 'member' && assignment.person.status !== 'member';
  // A personal space leaves its ordinary "You" unsaid; the whole space, nobody and anyone else are always named. A
  // starting balance is the space's history, not anyone's.
  const shownAssignment =
    isSystem || (isPersonal && isOwnAssignment(assignment, selfId)) ? null : assignmentLabel(assignment, selfId);
  const tag = isSystem ? 'Archived' : author.source === 'imported' ? 'Imported' : null;

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
          name={isSystem ? 'archive' : transaction.category.icon}
          size={20}
          color={isIncome ? colors.ok : colors.text}
        />
      </View>

      <View style={styles.textColumn}>
        <View style={[styles.topLine, isLargeText && styles.lineStacked]}>
          <View style={styles.titleRow}>
            <Text style={styles.category} numberOfLines={isLargeText ? 2 : 1}>
              {transaction.category.name}
            </Text>

            {tag && <Text style={styles.tag}>{tag}</Text>}
          </View>

          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.muted} />
          ) : (
            <Text style={[styles.amount, isIncome && styles.income]}>
              {isAmountHidden
                ? `${isSystem ? '' : isIncome ? '+' : '-'}••••`
                : isSystem
                  ? formatMoneyAmount(transaction.amount, currencyCode)
                  : formatAmount(transaction.amount, transaction.transactionType, currencyCode)}
            </Text>
          )}
        </View>

        {/* The time never shrinks; the description gives way first, then only an assignment past its share. */}
        <View style={[styles.metaLine, isLargeText && styles.metaLineWrapped]}>
          {description && (
            <Text style={[styles.meta, styles.description]} numberOfLines={1}>
              {description}
            </Text>
          )}

          {description && shownAssignment && <Text style={[styles.meta, styles.fixed]}>{' · '}</Text>}

          {shownAssignment && (
            <Text
              style={[
                styles.meta,
                description ? styles.assignmentBeside : styles.assignmentAlone,
                isPersonGone && styles.metaFaint,
              ]}
              numberOfLines={1}
            >
              {shownAssignment}
            </Text>
          )}

          <Text style={[styles.meta, styles.fixed]}>
            {`${description || shownAssignment ? ' · ' : ''}${formatDateHHMM(transaction.timestamp, timeZone)}`}
          </Text>
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
          <Icon name="trash" size={18} color={colors.onDanger} strokeWidth={2} />
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      )}
    >
      {card}
    </ReanimatedSwipeable>
  );
};

export default TransactionCard;
