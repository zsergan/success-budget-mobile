import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import { SectionList, Text, View } from 'react-native';

import { TransactionCard, useScreenTopInset } from '@components';
import type { TransactionModel } from '@api/models';
import type { TransactionGroup } from '@shared/utils';
import { formatSignedAmount } from '@shared/utils';

import styles from './style';

interface Section {
  key: string;
  title: string;
  total: number;
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
  // A row to bring into view and light up once it is in the list.
  highlightId?: string | null;
}

const TransactionsList = ({
  groups,
  currencyCode,
  header,
  placeholder,
  onPressTransaction,
  onDeleteTransaction,
  highlightId = null,
}: Props) => {
  const topInset = useScreenTopInset();
  const listRef = useRef<SectionList<TransactionModel, Section>>(null);
  const scrolledToRef = useRef<string | null>(null);
  const sections: Section[] = groups.map((group, index) => ({
    key: group.key,
    title: group.label,
    total: group.total,
    isFirst: index === 0,
    data: group.items,
  }));

  useEffect(() => {
    if (!highlightId) {
      scrolledToRef.current = null;
      return;
    }
    if (scrolledToRef.current === highlightId) return;

    const sectionIndex = groups.findIndex((group) => group.items.some(({ id }) => id === highlightId));
    if (sectionIndex < 0) return;

    scrolledToRef.current = highlightId;
    const itemIndex = groups[sectionIndex].items.findIndex(({ id }) => id === highlightId);
    listRef.current?.scrollToLocation({ sectionIndex, itemIndex, viewPosition: 0.4 });
  }, [groups, highlightId]);

  return (
    <SectionList
      ref={listRef}
      style={styles.body}
      contentContainerStyle={[styles.container, { paddingTop: topInset }]}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={ItemSeparator}
      ListHeaderComponent={header}
      ListEmptyComponent={placeholder}
      // Rows far below are not measured yet; scrolling there once they render lands on the row.
      onScrollToIndexFailed={({ averageItemLength, index }) =>
        listRef.current?.getScrollResponder()?.scrollTo({ y: averageItemLength * index, animated: true })
      }
      renderSectionHeader={({ section }) => (
        <View style={[styles.groupHeader, section.isFirst ? styles.groupHeaderFirst : styles.groupHeaderSpaced]}>
          <Text style={styles.groupLabel}>{section.title}</Text>

          <Text style={[styles.groupTotal, section.total > 0 && styles.groupTotalPositive]}>
            {formatSignedAmount(section.total, currencyCode)}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <TransactionCard
          transaction={item}
          currencyCode={currencyCode}
          isHighlighted={item.id === highlightId}
          onPress={onPressTransaction}
          onDelete={onDeleteTransaction}
        />
      )}
    />
  );
};

export default TransactionsList;
