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
      // Absent while the current month is already selected: there is nothing to reset to.
      onResetRange?: () => void;
      onJumpToLatest: () => void;
    }
  | { variant: 'noMatches'; onClearFilter: () => void }
  | { variant: 'noSearchMatches'; query: string; activeRange: DateRange; onClearSearch: () => void }
  | { variant: 'rangeError'; onRetry: () => void }
  | { variant: 'latestError'; onRetry: () => void };

// The full text stays in the field; the message only quotes the start of a long one.
const QUOTE_LENGTH = 40;
const quote = (text: string) => (text.length > QUOTE_LENGTH ? `${text.slice(0, QUOTE_LENGTH - 1)}…` : text);

const jumpLabel = (latest: TransactionModel) => `Jump to ${formatDateDDMMYYYY(latest.timestamp)}`;

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
        title="Nothing matches this filter"
        description="These transactions may have been deleted or changed since."
        actionLabel="Clear filter"
        onActionPress={props.onClearFilter}
      />
    )}

    {props.variant === 'noSearchMatches' && (
      <EmptyState
        variant="solid"
        icon="search"
        title={`No matches for “${quote(props.query)}”`}
        description={`Nothing in descriptions, categories or wallet names between ${formatRangeLabel(props.activeRange)}. You can change the period above.`}
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
