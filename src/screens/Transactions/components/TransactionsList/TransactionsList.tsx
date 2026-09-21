import { SectionList, Text, View } from 'react-native';

import { TransactionCard } from '@components';
import type { TransactionModel } from '@api/models';
import type { TransactionGroup } from '@shared/utils';
import { formatSignedAmount } from '@shared/utils';

import styles from './style';

interface Section {
  title: string;
  total?: number;
  currencyCode?: string;
  /** The first header sits right under the filter bar and needs no gap above it. */
  isFirst: boolean;
  data: TransactionModel[];
}

const ItemSeparator = () => <View style={styles.itemSeparator} />;

interface Props {
  groups: TransactionGroup[];
  currencyCode?: string;
}

const TransactionsList = ({ groups, currencyCode }: Props) => {
  const sections: Section[] = groups.map((group, index) => ({
    title: group.label,
    total: group.total,
    currencyCode: group.currencyCode,
    isFirst: index === 0,
    data: group.items,
  }));

  return (
    <SectionList
      style={styles.body}
      contentContainerStyle={styles.container}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={ItemSeparator}
      renderSectionHeader={({ section }) => (
        <View style={[styles.groupHeader, !section.isFirst && styles.groupHeaderSpaced]}>
          <Text style={styles.groupLabel}>{section.title}</Text>

          {section.total !== undefined && (
            <Text style={[styles.groupTotal, section.total >= 0 && styles.groupTotalPositive]}>
              {formatSignedAmount(section.total, section.currencyCode)}
            </Text>
          )}
        </View>
      )}
      renderItem={({ item }) => <TransactionCard transaction={item} currencyCode={currencyCode} />}
    />
  );
};

export default TransactionsList;
