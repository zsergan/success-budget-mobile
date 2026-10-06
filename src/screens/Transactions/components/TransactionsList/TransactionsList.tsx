import type { ReactElement } from 'react';
import { SectionList, Text, View } from 'react-native';

import { TransactionCard, useScreenTopInset } from '@components';
import type { TransactionModel } from '@api/models';
import type { TransactionGroup } from '@shared/utils';
import { formatSignedAmount } from '@shared/utils';

import styles from './style';

interface Section {
  title: string;
  total?: number;
  currencyCode?: string;
  /** The first header sits right under the filter bar and takes a smaller gap above it. */
  isFirst: boolean;
  data: TransactionModel[];
}

const ItemSeparator = () => <View style={styles.itemSeparator} />;

interface Props {
  groups: TransactionGroup[];
  currencyCode?: string;
  header: ReactElement;
  // Shown in place of the groups while there are none (loading, empty or error states).
  placeholder: ReactElement;
  onPressTransaction: (transaction: TransactionModel) => void;
  onDeleteTransaction: (transaction: TransactionModel, onSettled: () => void) => void;
}

const TransactionsList = ({
  groups,
  currencyCode,
  header,
  placeholder,
  onPressTransaction,
  onDeleteTransaction,
}: Props) => {
  const topInset = useScreenTopInset();
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
      contentContainerStyle={[styles.container, { paddingTop: topInset }]}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={ItemSeparator}
      ListHeaderComponent={header}
      ListEmptyComponent={placeholder}
      renderSectionHeader={({ section }) => (
        <View style={[styles.groupHeader, section.isFirst ? styles.groupHeaderFirst : styles.groupHeaderSpaced]}>
          <Text style={styles.groupLabel}>{section.title}</Text>

          {section.total !== undefined && (
            <Text style={[styles.groupTotal, section.total >= 0 && styles.groupTotalPositive]}>
              {formatSignedAmount(section.total, section.currencyCode)}
            </Text>
          )}
        </View>
      )}
      renderItem={({ item }) => (
        <TransactionCard
          transaction={item}
          currencyCode={currencyCode}
          onPress={onPressTransaction}
          onDelete={onDeleteTransaction}
        />
      )}
    />
  );
};

export default TransactionsList;
