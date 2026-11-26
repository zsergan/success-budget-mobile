import { View } from 'react-native';

import { EmptyState } from '@components';
import type { TransactionModel } from '@api/models';
import type { DateRange } from '@shared/utils';
import { formatLongDate, formatRangeLabel } from '@shared/utils';

import styles from './style';

type Props =
  | { variant: 'trueEmpty'; onAddTransaction: () => void }
  | {
      variant: 'filteredEmpty';
      latest: TransactionModel;
      activeRange: DateRange;
      // Absent while the current month is already selected: there is nothing to reset to.
      onResetRange?: () => void;
      onJumpToLatest: () => void;
    }
  | { variant: 'noMatches' }
  | { variant: 'noFilterMatches'; activeRange: DateRange; onClearFilters: () => void }
  | { variant: 'noSearchMatches'; query: string; activeRange: DateRange; onClearSearch: () => void }
  | { variant: 'rangeError'; onRetry: () => void }
  | { variant: 'latestError'; onRetry: () => void };

// The full text stays in the field; the message only quotes the start of a long one.
const QUOTE_LENGTH = 40;
const quote = (text: string) => (text.length > QUOTE_LENGTH ? `${text.slice(0, QUOTE_LENGTH - 1)}…` : text);

const jumpLabel = (latest: TransactionModel) => `Jump to ${formatLongDate(latest.date)}`;

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
        description={`No transactions between ${formatRangeLabel(props.activeRange)}. Your last one was on ${formatLongDate(props.latest.date)}.`}
        {...(props.onResetRange
          ? {
              actionLabel: 'Reset to this month',
              actionVariant: 'secondary' as const,
              onActionPress: props.onResetRange,
              secondaryActionLabel: jumpLabel(props.latest),
              onSecondaryActionPress: props.onJumpToLatest,
            }
          : { actionLabel: jumpLabel(props.latest), onActionPress: props.onJumpToLatest })}
      />
    )}

    {props.variant === 'noMatches' && (
      <EmptyState
        variant="solid"
        icon="filter"
        title="No transactions here"
        description="They may have been changed or deleted since Stats was opened."
      />
    )}

    {props.variant === 'noFilterMatches' && (
      <EmptyState
        variant="solid"
        icon="filter"
        title="Nothing matches these filters"
        description={`No transactions of this type or assignment between ${formatRangeLabel(props.activeRange)}.`}
        actionLabel="Clear filters"
        onActionPress={props.onClearFilters}
      />
    )}

    {props.variant === 'noSearchMatches' && (
      <EmptyState
        variant="solid"
        icon="search"
        title={`No matches for “${quote(props.query)}”`}
        description={`Nothing in descriptions or categories between ${formatRangeLabel(props.activeRange)}. To see what’s assigned to someone, use the Assigned to filter.`}
        actionLabel="Clear search"
        onActionPress={props.onClearSearch}
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
