import { View } from 'react-native';

import { EmptyState } from '@components';
import type { TransactionModel } from '@api/models';
import type { DateRange } from '@shared/utils';
import { formatDateDDMMYYYY, formatRangeLabel } from '@shared/utils';

import styles from './style';

type Props =
  | { variant: 'trueEmpty'; onAddTransaction: () => void }
  | {
      variant: 'filteredEmpty';
      latest: TransactionModel;
      activeRange: DateRange;
      onResetRange: () => void;
      onJumpToLatest: () => void;
    };

const TransactionsEmptyState = (props: Props) => (
  <View style={styles.emptyContainer}>
    {props.variant === 'trueEmpty' ? (
      <EmptyState
        icon="list"
        title="No transactions yet"
        description="Your income and expenses will show up here."
        actionLabel="Add transaction"
        actionIcon="plus"
        onActionPress={props.onAddTransaction}
      />
    ) : (
      <EmptyState
        variant="solid"
        icon="calendar"
        title="Nothing in this period"
        description={`No transactions between ${formatRangeLabel(props.activeRange)}. Your last one was on ${formatDateDDMMYYYY(props.latest.timestamp)}.`}
        actionLabel="Reset to this month"
        actionVariant="secondary"
        onActionPress={props.onResetRange}
        secondaryActionLabel={`Jump to ${formatDateDDMMYYYY(props.latest.timestamp)}`}
        onSecondaryActionPress={props.onJumpToLatest}
      />
    )}
  </View>
);

export default TransactionsEmptyState;
