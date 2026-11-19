import type { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { AvatarSubject } from '@components';
import { AssignmentAvatar, Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { useAppSelector } from '@redux/hooks';
import { selectProfileId } from '@redux/state/profile/selectors';
import { TransactionType } from '@shared/enums';
import type { HistoryFilters as Filters } from '@screens/Transactions/hooks/useTransactionsData';

import createStyles from './style';

interface Props {
  filters: Filters;
  onOpenType: () => void;
  onOpenAssignment: () => void;
  onClearType: () => void;
  onClearAssignment: () => void;
}

const subjectOf = (key: NonNullable<Filters['assignment']>, name: string | undefined): AvatarSubject => {
  if (key === 'space' || key === 'unassigned') return { kind: key };
  if (key === 'deleted_member') return { kind: 'member', userId: null, name: null, status: 'deleted' };

  return { kind: 'member', userId: Number(key.slice('member:'.length)), name: name ?? null, status: 'member' };
};

// How History is narrowed besides its period: by type and by whom a record is assigned to. A chip opens its choices;
// a set one also takes its filter off with ✕.
const HistoryFilters = ({ filters, onOpenType, onOpenAssignment, onClearType, onClearAssignment }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const selfId = useAppSelector(selectProfileId);
  const { transactionType, assignment, assignmentName } = filters;

  const chip = (label: string, isSet: boolean, onOpen: () => void, onClear: () => void, leading?: ReactNode) => (
    <View style={[styles.chip, isSet && styles.chipSet]}>
      <TouchableOpacity
        style={styles.chipBody}
        onPress={onOpen}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label}. Change filter`}
      >
        {leading}
        <Text style={[styles.chipText, isSet && styles.chipTextSet]} numberOfLines={1}>
          {label}
        </Text>
        {!isSet && <Icon name="chevron-down" size={12} color={colors.muted} strokeWidth={2.2} />}
      </TouchableOpacity>

      {isSet && (
        <TouchableOpacity
          style={styles.clear}
          onPress={onClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove the ${label} filter`}
        >
          <Icon name="close" size={11} color={colors.onSecondary} strokeWidth={2.4} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.row}>
      {chip(
        transactionType === TransactionType.EXPENSE ? 'Expenses' : transactionType ? 'Income' : 'All types',
        !!transactionType,
        onOpenType,
        onClearType,
      )}
      {chip(
        assignment ? (assignmentName ?? 'Assigned') : 'All transactions',
        !!assignment,
        onOpenAssignment,
        onClearAssignment,
        assignment && <AssignmentAvatar subject={subjectOf(assignment, assignmentName)} selfId={selfId} size={18} />,
      )}
    </View>
  );
};

export default HistoryFilters;
