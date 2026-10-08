import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  PixelRatio,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@components/Icon/Icon';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import { whereSaved } from '@redux/state/transactionFlow/selection';
import type { TransactionFlow } from '@redux/state/transactionFlow/slice';
import { autoClosed, autoCloseStopped, CREATED_AUTO_CLOSE_MS } from '@redux/state/transactionFlow/slice';
import type { CreateTransactionResult } from '@api/models';
import { TransactionType } from '@shared/enums';
import theme, { colors } from '@shared/theme';
import { formatAmount, formatCurrencyAmount, formatDateLong, formatDayMonth, hexToRgba } from '@shared/utils';
import { deleteFailureText } from '../deleteMessage';
import Banner from '@components/Banner/Banner';
import { formatDateTime } from '../format';

import styles from './style';

// Read aloud or in large type, a confirmation that leaves on its own could go before it is read.
const LARGE_FONT_SCALE = 1.3;

interface Props {
  flow: TransactionFlow & { created: CreateTransactionResult };
  onUndo: () => void;
  onShow: () => void;
  onOpenRecord: () => void;
  onAddAnother: () => void;
  onDone: () => void;
}

const savedToLabel = (timestamp: string) =>
  new Date(timestamp).getFullYear() === new Date().getFullYear()
    ? formatDayMonth(timestamp)
    : formatDateLong(timestamp);

// Shown only after the API confirmed the create. It closes by itself after a while unless touched.
const CreatedConfirmation = ({ flow, onUndo, onShow, onOpenRecord, onAddAnother, onDone }: Props) => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const {
    draftId,
    autoCloseAt,
    isSaving: isUndoing,
    notice,
    selection,
    created: { transaction, wallet, previousBalance },
  } = flow;
  const typeColor = transaction.transactionType === TransactionType.INCOME ? colors.ok : colors.danger;
  const place = whereSaved(transaction, selection);
  const [remaining] = useState(() => new Animated.Value(1));

  const stopTimer = () => {
    if (autoCloseAt !== null) dispatch(autoCloseStopped({ draftId }));
  };

  useEffect(() => {
    if (PixelRatio.getFontScale() >= LARGE_FONT_SCALE) dispatch(autoCloseStopped({ draftId }));
    AccessibilityInfo.isScreenReaderEnabled()
      .then((isEnabled) => isEnabled && dispatch(autoCloseStopped({ draftId })))
      .catch(() => {});
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

        <Text style={styles.title}>Transaction saved</Text>

        <Text
          style={[styles.amount, { color: typeColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {formatAmount(transaction.amount, transaction.transactionType, currencyCode)}
        </Text>

        <Text style={styles.meta} numberOfLines={2}>
          {`${transaction.category.name} · ${wallet.wallet_name} · ${formatDateTime(transaction.timestamp)}`}
        </Text>

        <Text style={styles.balance}>
          {`${wallet.wallet_name} balance ${formatCurrencyAmount(wallet.balance, currencyCode)} · was ${formatCurrencyAmount(previousBalance, currencyCode)}`}
        </Text>

        {place !== 'shown' && (
          <View style={styles.hiddenRow}>
            <Text style={styles.hiddenText}>
              {place === 'otherPeriod'
                ? `Saved to ${savedToLabel(transaction.timestamp)} — outside the period you’re viewing`
                : `Saved, but hidden by the “${selection?.filter?.name}” filter`}
            </Text>

            <TouchableOpacity onPress={onShow} disabled={isUndoing} hitSlop={8} accessibilityRole="button">
              <Text style={styles.showText}>Show</Text>
            </TouchableOpacity>
          </View>
        )}

        {notice === 'conflict' ? (
          <View style={styles.banner}>
            <Banner
              tone="warn"
              title="This transaction was changed"
              text="Someone saved it after it was created, so it wasn’t undone. Open it to see the latest version."
              actionLabel="Open"
              onAction={onOpenRecord}
            />
          </View>
        ) : (
          (notice === 'deleteFailed' || notice === 'deleteUncertain') && (
            <View style={styles.banner}>
              <Banner
                tone="danger"
                text={deleteFailureText(notice, 'undo')}
                actionLabel="Try again"
                onAction={onUndo}
              />
            </View>
          )
        )}
      </BottomSheetScrollView>

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

      <View style={[styles.actions, isUndoing && styles.actionsLocked]}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onAddAnother}
          disabled={isUndoing}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Add another</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onDone}
          disabled={isUndoing}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CreatedConfirmation;
