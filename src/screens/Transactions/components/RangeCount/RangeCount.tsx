import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { skipToken } from '@reduxjs/toolkit/query';

import { getLoadState } from '@redux/api/loadState';
import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { periodArg, useGetTransactionsCountQuery } from '@redux/state/transaction/api';
import { colors } from '@shared/theme';
import type { DateRange } from '@shared/utils';

import styles from './style';

interface Props {
  range: DateRange;
  // The search shown in the history, so the count matches the rows it would list.
  q?: string;
}

const countLabel = (count: number) =>
  count === 0 ? 'No transactions' : `${count} transaction${count === 1 ? '' : 's'}`;

// The records in a drafted range, counted by the server; currentData never shows the count of a previous range.
const RangeCount = ({ range, q }: Props) => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const text = q?.trim();
  const query = useGetTransactionsCountQuery(
    spaceId === null ? skipToken : { ...periodArg(spaceId, range), ...(text && { q: text }) },
  );
  const { isLoading, hasError } = getLoadState(query);

  if (hasError) {
    return (
      <View style={styles.row}>
        <Text style={styles.text}>Couldn’t count transactions</Text>
        <TouchableOpacity onPress={query.refetch} hitSlop={8} accessibilityRole="button">
          <Text style={styles.retry}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || query.currentData === undefined) {
    return (
      <View style={styles.row} accessibilityLabel="Counting transactions">
        <ActivityIndicator size="small" color={colors.muted} />
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Text style={styles.text}>{countLabel(query.currentData)}</Text>
    </View>
  );
};

export default RangeCount;
