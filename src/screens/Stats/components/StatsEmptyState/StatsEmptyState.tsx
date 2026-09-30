import { Text } from 'react-native';

import { EmptyState } from '@components';
import { formatDayMonth, formatMonthYearShort } from '@screens/Stats/format';

import styles from './style';

type Props =
  | { variant: 'noHistory'; onAddTransaction: () => void }
  | {
      variant: 'emptyPeriod';
      rangeLabel: string;
      isCurrentMonth: boolean;
      lastTransactionDate: string;
      onReset?: () => void;
      onOpenLastMonth: () => void;
    }
  | { variant: 'future'; rangeLabel: string; onReset: () => void };

const StatsEmptyState = (props: Props) => {
  if (props.variant === 'noHistory') {
    return (
      <EmptyState
        icon="chart"
        title="Nothing to report yet"
        description="Stats appear after your first transaction: totals, a trend by week and a breakdown by category."
        actionLabel="Add transaction"
        actionIcon="plus"
        onActionPress={props.onAddTransaction}
      />
    );
  }

  if (props.variant === 'future') {
    return (
      <EmptyState
        variant="solid"
        icon="calendar"
        title="This period hasn't started"
        description={
          <>
            <Text style={styles.emphasis}>{props.rangeLabel}</Text> is still ahead, so there is nothing to report yet.
          </>
        }
        actionLabel="Back to this month"
        actionVariant="secondary"
        onActionPress={props.onReset}
      />
    );
  }

  const last = `Your last one was on ${formatDayMonth(props.lastTransactionDate)}.`;
  const openLabel = `Open ${formatMonthYearShort(props.lastTransactionDate)}`;

  return (
    <EmptyState
      variant="solid"
      icon="calendar"
      title={props.isCurrentMonth ? 'Nothing this month yet' : 'Nothing in this period'}
      description={
        props.isCurrentMonth ? (
          <>
            No transactions in <Text style={styles.emphasis}>{props.rangeLabel}</Text> so far. {last}
          </>
        ) : (
          <>
            No transactions between <Text style={styles.emphasis}>{props.rangeLabel}</Text>, so there is nothing to
            chart. {last}
          </>
        )
      }
      {...(props.onReset
        ? {
            actionLabel: 'Reset filters',
            actionIcon: 'close' as const,
            actionVariant: 'secondary' as const,
            onActionPress: props.onReset,
            secondaryActionLabel: openLabel,
            onSecondaryActionPress: props.onOpenLastMonth,
          }
        : { actionLabel: openLabel, actionVariant: 'secondary' as const, onActionPress: props.onOpenLastMonth })}
    />
  );
};

export default StatsEmptyState;
