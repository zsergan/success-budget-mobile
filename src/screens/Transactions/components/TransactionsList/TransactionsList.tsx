import { ScrollView, Text, View } from 'react-native';

import { TransactionCard } from '@components';
import type { TransactionGroup } from '@shared/utils';
import { formatNumber } from '@shared/utils';

import styles from './style';

interface Props {
  groups: TransactionGroup[];
  currencyCode?: string;
}

const TransactionsList = ({ groups, currencyCode }: Props) => (
  <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
    <View style={styles.container}>
      {groups.map((group) => (
        <View key={group.label} style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupLabel}>{group.label}</Text>

            {group.total !== undefined && (
              <Text style={[styles.groupTotal, group.total >= 0 && styles.groupTotalPositive]}>
                {`${group.total >= 0 ? '+' : '-'}${formatNumber(Math.abs(group.total))}${
                  group.currencyCode ? ` ${group.currencyCode}` : ''
                }`}
              </Text>
            )}
          </View>

          <View style={styles.groupItems}>
            {group.items.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} currencyCode={currencyCode} />
            ))}
          </View>
        </View>
      ))}
    </View>
  </ScrollView>
);

export default TransactionsList;
