import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  PixelRatio,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AssignmentAvatar from '@components/AssignmentAvatar/AssignmentAvatar';
import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectProfileId } from '@redux/state/profile/selectors';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import { whereSaved } from '@redux/state/transactionFlow/selection';
import type { TransactionFlow } from '@redux/state/transactionFlow/slice';
import { autoClosed, autoCloseStopped, CREATED_AUTO_CLOSE_MS } from '@redux/state/transactionFlow/slice';
import type { TransactionWriteResult } from '@api/models';
import { TransactionType } from '@shared/enums';
import theme from '@shared/theme';
import type { CalendarDate } from '@shared/utils';
import { assignmentLabel, calendarYear, deviceToday, formatAmount, formatCalendarDate, hexToRgba } from '@shared/utils';
import { deleteFailureAction, deleteFailureText } from '../deleteMessage';
import Banner from '@components/Banner/Banner';
import { formatTransactionDate } from '../format';

import createStyles from './style';

// Read aloud or in large type, a confirmation that leaves on its own could go before it is read.
const LARGE_FONT_SCALE = 1.3;

interface Props {
  flow: TransactionFlow & { created: TransactionWriteResult };
  onUndo: () => void;
  // The record's details, in its own period when the screen it was made from shows another.
  onView: () => void;
  onAddAnother: () => void;
  onDone: () => void;
}

const savedToLabel = (date: CalendarDate) =>
  formatCalendarDate(date, {
    day: 'numeric',
    month: 'short',
    ...(calendarYear(date) !== calendarYear(deviceToday()) && { year: 'numeric' }),
  });

// Shown only after the API confirmed the create. It closes by itself after a while unless touched.
const CreatedConfirmation = ({ flow, onUndo, onView, onAddAnother, onDone }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const selfId = useAppSelector(selectProfileId);
  const {
    draftId,
    autoCloseAt,
    isSaving: isUndoing,
    notice,
    selection,
    created: { transaction },
  } = flow;
  const isIncome = transaction.transactionType === TransactionType.INCOME;
  const typeColor = isIncome ? colors.ok : colors.danger;
  const place = whereSaved(transaction, selection);
  const { assignment } = transaction;
  const [remaining] = useState(() => new Animated.Value(1));

  const stopTimer = () => {
    if (autoCloseAt !== null) dispatch(autoCloseStopped({ draftId }));
  };

  useEffect(() => {
    if (PixelRatio.getFontScale() >= LARGE_FONT_SCALE) dispatch(autoCloseStopped({ draftId }));
  }, [dispatch, draftId, fontScale]);

  useEffect(() => {
    const stopForReader = (isEnabled: boolean) => {
      if (isEnabled) dispatch(autoCloseStopped({ draftId }));
    };
    AccessibilityInfo.isScreenReaderEnabled()
      .then(stopForReader)
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', stopForReader);
    return () => subscription.remove();
  }, [dispatch, draftId]);

  useEffect(() => {
    if (autoCloseAt === null) return;

    const left = Math.max(0, autoCloseAt - Date.now());
    remaining.setValue(left / CREATED_AUTO_CLOSE_MS);
    const animation = Animated.timing(remaining, {
      toValue: 0,
      duration: left,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    const timer = setTimeout(() => dispatch(autoClosed({ draftId })), left);

    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [autoCloseAt, dispatch, draftId, remaining]);

  return (
    <View style={[styles.root, { paddingBottom: theme.spacing.xl + insets.bottom }]} onTouchStart={stopTimer}>
      {autoCloseAt !== null && (
        <View style={styles.timerTrack}>
          <Animated.View
            style={[styles.timerBar, { backgroundColor: typeColor, transform: [{ scaleX: remaining }] }]}
          />
        </View>
      )}

      <BottomSheetScrollView style={styles.scroll} contentContainerStyle={styles.body}>
        <View style={[styles.check, { backgroundColor: hexToRgba(typeColor, 0.12) }]}>
          <Icon name="check" size={28} color={typeColor} strokeWidth={2.4} />
        </View>

        <Text style={styles.title}>{isIncome ? 'Income saved' : 'Expense saved'}</Text>

        <Text
          style={[styles.amount, { color: typeColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {formatAmount(transaction.amount, transaction.transactionType, currencyCode)}
        </Text>

        <View style={styles.facts}>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Category</Text>
            <Text style={styles.factValue} numberOfLines={1}>
              {transaction.category.name}
            </Text>
          </View>

          <View style={[styles.fact, styles.factSeparated]}>
            <Text style={styles.factLabel}>Assigned to</Text>
            <View style={styles.factPerson}>
              <AssignmentAvatar
                subject={assignment.kind === 'member' ? { kind: 'member', ...assignment.person } : assignment}
                selfId={selfId}
                size={22}
              />
              <Text style={styles.factValue} numberOfLines={2}>
                {assignmentLabel(assignment, selfId)}
              </Text>
            </View>
          </View>

          <View style={[styles.fact, styles.factSeparated]}>
            <Text style={styles.factLabel}>Date</Text>
            <Text style={styles.factValue}>{formatTransactionDate(transaction.date)}</Text>
          </View>
        </View>

        {place !== 'shown' && (
          <View style={styles.hiddenRow}>
            <Icon
              name={place === 'otherPeriod' ? 'calendar' : 'filter'}
              size={15}
              color={colors.text}
              strokeWidth={1.9}
            />
            <Text style={styles.hiddenText}>
              {place === 'otherPeriod'
                ? `Saved to ${savedToLabel(transaction.date)} — outside the period you’re viewing.`
                : 'Saved outside the filter you’re viewing, so the list doesn’t show it.'}
            </Text>
          </View>
        )}

        {notice === 'conflict' ? (
          <View style={styles.banner}>
            <Banner
              tone="warn"
              title="This transaction was changed"
              text="Someone saved it after it was created, so it wasn’t undone. Open it to see the latest version."
              actionLabel="Open"
              onAction={onView}
            />
          </View>
        ) : (
          (notice === 'deleteFailed' || notice === 'deleteUncertain') && (
            <View style={styles.banner}>
              <Banner
                tone="danger"
                text={deleteFailureText(notice, 'undo')}
                actionLabel={deleteFailureAction(notice)}
                onAction={onUndo}
              />
            </View>
          )
        )}
      </BottomSheetScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.undoButton}
          onPress={onUndo}
          disabled={isUndoing || notice === 'conflict'}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ disabled: isUndoing || notice === 'conflict', busy: isUndoing }}
        >
          {isUndoing ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Icon name="refresh" size={15} color={colors.text} strokeWidth={2} />
          )}
          <Text style={styles.undoText}>{isUndoing ? 'Undoing…' : 'Undo'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.accentButton, isUndoing && styles.actionsLocked]}
          onPress={onAddAnother}
          disabled={isUndoing}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Icon name="plus" size={15} color={colors.onAccent} strokeWidth={2.2} />
          <Text style={styles.accentButtonText}>Add another</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.actions, isUndoing && styles.actionsLocked]}>
        {/* Out of the viewed period, the record is what the user most likely wants to see. */}
        <TouchableOpacity
          style={place !== 'shown' ? styles.primaryButton : styles.secondaryButton}
          onPress={onView}
          disabled={isUndoing}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={place !== 'shown' ? styles.primaryButtonText : styles.secondaryButtonText}>
            View transaction
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={onDone}
          disabled={isUndoing}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CreatedConfirmation;
