import { View } from 'react-native';

import { EmptyState } from '@components';
import type { CalendarDate } from '@shared/utils';
import { formatLongDate } from '@shared/utils';

import styles from './style';

type Props =
  // Nothing recorded in the space yet: no setup is needed before the first one.
  | { variant: 'fresh'; spaceName: string; onAddTransaction: () => void }
  // Records exist, none in this month.
  | {
      variant: 'emptyMonth';
      monthName: string;
      lastDate: CalendarDate | null;
      // Absent on the current month, which has nowhere to go back to.
      currentName?: string;
      onBackToCurrent?: () => void;
    };

const HomeEmpty = (props: Props) => (
  <View style={styles.root}>
    {props.variant === 'fresh' ? (
      <EmptyState
        icon="plus"
        title="Start your first month"
        description={`Add income or an expense — there’s nothing to set up first. Everything you add lands in ${props.spaceName}. Totals, top spending and activity show up here after the first one.`}
        actionLabel="Add transaction"
        actionIcon="plus"
        onActionPress={props.onAddTransaction}
      />
    ) : (
      <EmptyState
        variant="solid"
        icon="calendar"
        title={`Nothing in ${props.monthName}`}
        description={`No transactions were recorded this month.${props.lastDate ? ` Your last one was on ${formatLongDate(props.lastDate)}.` : ''}`}
        {...(props.onBackToCurrent && props.currentName
          ? {
              actionLabel: `Back to ${props.currentName}`,
              actionVariant: 'secondary' as const,
              onActionPress: props.onBackToCurrent,
            }
          : {})}
      />
    )}
  </View>
);

export default HomeEmpty;
