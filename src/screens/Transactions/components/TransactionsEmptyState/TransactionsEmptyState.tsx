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
    }
  | { variant: 'rangeError'; onRetry: () => void }
  | { variant: 'latestError'; onRetry: () => void };

const TransactionsEmptyState = (props: Props) => (
  <View style={styles.emptyContainer}>
    {props.variant === 'trueEmpty' && (
      <EmptyState
        icon="list"
        title="No transactions yet"
        description="Your income and expenses will show up here."
        actionLabel="Add transaction"
        actionIcon="plus"
        onActionPress={props.onAddTransaction}
      />
    )}

    {props.variant === 'filteredEmpty' && (
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

    {props.variant === 'rangeError' && (
      <EmptyState
        icon="list"
        title="Couldn't load this period"
        description="Check your connection and try again."
        actionLabel="Retry"
        onActionPress={props.onRetry}
      />
    )}

    {props.variant === 'latestError' && (
      <EmptyState
        icon="list"
        title="Couldn't confirm this is empty"
        description="This period has no transactions, but we couldn't check the rest of your history to be sure. Try again."
        actionLabel="Retry"
        onActionPress={props.onRetry}
      />
    )}
  </View>
);

export default TransactionsEmptyState;
