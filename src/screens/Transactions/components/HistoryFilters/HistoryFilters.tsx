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
  onClearType: () => void;
  onClearAssignment: () => void;
}

const subjectOf = (key: NonNullable<Filters['assignment']>, name: string | undefined): AvatarSubject => {
  if (key === 'space' || key === 'unassigned') return { kind: key };
  if (key === 'deleted_member') return { kind: 'member', userId: null, name: null, status: 'deleted' };

  return { kind: 'member', userId: Number(key.slice('member:'.length)), name: name ?? null, status: 'member' };
};

// What History is narrowed to besides its period; each chip takes its filter off.
const HistoryFilters = ({ filters, onClearType, onClearAssignment }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const selfId = useAppSelector(selectProfileId);
  const { transactionType, assignment, assignmentName } = filters;

  if (!transactionType && !assignment) return null;

  const chip = (label: string, onPress: () => void, leading?: ReactNode) => (
    <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Remove filter`}
    >
      {leading}
      <Text style={styles.chipText} numberOfLines={1}>
        {label}
      </Text>
      <Icon name="close" size={11} color={colors.onSecondary} strokeWidth={2.4} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.row}>
      {transactionType && chip(transactionType === TransactionType.EXPENSE ? 'Expenses' : 'Income', onClearType)}
      {assignment &&
        chip(
          assignmentName ?? 'Assigned',
          onClearAssignment,
          <AssignmentAvatar subject={subjectOf(assignment, assignmentName)} selfId={selfId} size={18} />,
        )}
    </View>
  );
};

export default HistoryFilters;
