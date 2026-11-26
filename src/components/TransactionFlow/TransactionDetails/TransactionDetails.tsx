import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import type { TransactionModel } from '@api/models';
import { assignmentKeyOf, isInitialBalance } from '@api/models';
import type { ViewSelection } from '@redux/state/transactionFlow/selection';
import { whereSaved } from '@redux/state/transactionFlow/selection';
import type { AvatarSubject } from '@components/AssignmentAvatar/AssignmentAvatar';
import AssignmentAvatar from '@components/AssignmentAvatar/AssignmentAvatar';
import Icon from '@components/Icon/Icon';
import useCategoryAppearance from '@hooks/useCategoryAppearance';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectProfileId } from '@redux/state/profile/selectors';
import { selectCurrentSpaceCurrencyCode, selectIsPersonalSpace } from '@redux/state/space/selectors';
import type { TransactionFlow } from '@redux/state/transactionFlow/slice';
import { editStarted } from '@redux/state/transactionFlow/slice';
import { checkFlowRecord, loadLatestRecord } from '@redux/state/transactionFlow/thunks';
import { TransactionType } from '@shared/enums';
import theme from '@shared/theme';
import { assignmentLabel, authorLabel, formatAmount, formatMoneyAmount, hexToRgba } from '@shared/utils';
import DeleteButton from '../DeleteButton/DeleteButton';
import { deleteFailureAction, deleteFailureText } from '../deleteMessage';
import Banner from '@components/Banner/Banner';
import { formatTransactionDate } from '../format';

import createStyles from './style';

interface Props {
  flow: TransactionFlow & { saved: TransactionModel };
  onClose: () => void;
  onDelete: () => void;
  onRetryDelete: () => void;
}

// Shows the record the list had at once; Edit and Delete wait until it is read again, so neither acts on an old
// version.
// Why an edited record is no longer in the list the details were opened from.
const movedOutText = (
  transaction: TransactionModel,
  selection: ViewSelection | null,
  selfId: number | undefined,
): string => {
  if (whereSaved(transaction, selection) === 'otherPeriod') {
    return `Now dated ${formatTransactionDate(transaction.date)}, outside the period this list shows, so it left the list.`;
  }
  if (selection?.assignment !== undefined && assignmentKeyOf(transaction.assignment) !== selection.assignment) {
    return `Now assigned to ${assignmentLabel(transaction.assignment, selfId)}, so it left this filtered list.`;
  }

  return 'It no longer matches this list’s filter, so it left the list.';
};

const TransactionDetails = ({
  flow: { saved: transaction, check, notice, isSaving, selection },
  onClose,
  onDelete,
  onRetryDelete,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const selfId = useAppSelector(selectProfileId);
  const isPersonal = useAppSelector(selectIsPersonalSpace);
  const [isLoadingLatest, setLoadingLatest] = useState(false);
  const canAct = check === 'done' && notice !== 'conflict' && !isSaving;

  const loadLatest = async () => {
    setLoadingLatest(true);
    await dispatch(loadLatestRecord());
    setLoadingLatest(false);
  };

  const isSystem = isInitialBalance(transaction);
  const { assignment, author } = transaction;
  const isImported = author.source === 'imported';
  const assignee: AvatarSubject = assignment.kind === 'member' ? { kind: 'member', ...assignment.person } : assignment;
  const assigneeSub =
    assignment.kind === 'space' ? (isPersonal ? 'Space-level operation' : 'Counts once in the space total') : undefined;
  const isAssigneeGone = assignment.kind === 'member' && assignment.person.status !== 'member';
  // An imported author was filled in when wallets were retired: it says whom the record was given to, not who entered it.
  const authorSub = isImported
    ? author.name
      ? `Filled in as ${author.name} during the move from wallets`
      : 'Filled in during the move from wallets'
    : undefined;

  const person = (label: string, subject: AvatarSubject, value: string, sub?: string, isMuted = false) => (
    <View style={styles.property}>
      <Text style={styles.propertyLabel}>{label}</Text>

      <View style={styles.personValue}>
        <AssignmentAvatar subject={subject} selfId={selfId} size={24} />

        <View style={styles.personTexts}>
          <Text style={[styles.propertyValue, isMuted && styles.propertyValueMuted]} numberOfLines={2}>
            {value}
          </Text>
          {sub && <Text style={styles.propertySub}>{sub}</Text>}
        </View>
      </View>
    </View>
  );
  const isIncome = transaction.transactionType === TransactionType.INCOME;
  const typeColor = isSystem ? colors.text : isIncome ? colors.ok : colors.danger;
  const categoryLook = useCategoryAppearance()(transaction.category.color);

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
          <View style={[styles.heroIcon, { backgroundColor: isSystem ? colors.track : categoryLook.tint }]}>
            <Icon
              name={isSystem ? 'archive' : transaction.category.icon}
              size={26}
              color={isSystem ? colors.text : categoryLook.stroke}
              strokeWidth={1.9}
            />
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
              {isSystem ? 'Starting balance · not counted' : isIncome ? 'Income' : 'Expense'}
            </Text>
          </View>
        </View>

        {transaction.description && (
          <View style={styles.card}>
            <Text style={styles.description}>{transaction.description}</Text>
          </View>
        )}

        <View style={styles.card}>
          {!isSystem && (
            <>
              {person('Assigned to', assignee, assignmentLabel(assignment, selfId), assigneeSub, isAssigneeGone)}
              <View style={styles.divider} />
            </>
          )}

          {person(
            'Created by',
            isImported ? { kind: 'imported' } : { kind: 'member', ...author },
            authorLabel(author, selfId),
            authorSub,
            isImported || author.status !== 'member',
          )}

          <View style={styles.divider} />

          <View style={styles.property}>
            <Text style={styles.propertyLabel}>Date</Text>
            <Text style={styles.propertyValue}>{formatTransactionDate(transaction.date)}</Text>
          </View>
        </View>
        {isImported && !isSystem && (
          <View style={styles.importNote}>
            <Icon name="info" size={14} color={colors.muted} strokeWidth={1.9} />
            <Text style={styles.importNoteText}>
              Moved from wallets when they were retired. Amount, date, category and note are unchanged.
            </Text>
          </View>
        )}
      </BottomSheetScrollView>

      {isSystem ? (
        <Text style={styles.systemNote}>Kept for history. Not part of income, expenses, monthly net or limits.</Text>
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
          ) : notice === 'recordChanged' ? (
            <Banner
              tone="warn"
              title="This transaction changed"
              text="An earlier change reached the server first, so it wasn’t deleted. This is its latest version: delete it again if you still want to."
            />
          ) : notice === 'movedOut' ? (
            <Banner tone="success" title="Saved" text={movedOutText(transaction, selection, selfId)} />
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
