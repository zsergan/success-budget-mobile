import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import type { ViewToken } from 'react-native';
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
  // Called once the highlighted row is actually on screen.
  onHighlightSeen?: () => void;
}

const VIEWABILITY = { itemVisiblePercentThreshold: 60 };

// Whether the row is in the list to scroll to.
const scrollToRow = (
  list: SectionList<TransactionModel, Section> | null,
  groups: TransactionGroup[],
  rowId: string,
) => {
  const sectionIndex = groups.findIndex((group) => group.items.some(({ id }) => id === rowId));
  if (sectionIndex < 0) return false;

  const itemIndex = groups[sectionIndex].items.findIndex(({ id }) => id === rowId);
  list?.scrollToLocation({ sectionIndex, itemIndex, viewPosition: 0.4 });
  return true;
};

const TransactionsList = ({
  groups,
  currencyCode,
  header,
  placeholder,
  onPressTransaction,
  onDeleteTransaction,
  highlightId = null,
  onHighlightSeen,
}: Props) => {
  const topInset = useScreenTopInset();
  const listRef = useRef<SectionList<TransactionModel, Section>>(null);
  const scrolledToRef = useRef<string | null>(null);
  // A scroll that had to land near the row, not on it, is repeated once the row is rendered and measured.
  const awaitsExactRef = useRef(false);
  const visibleIdsRef = useRef<string[]>([]);
  const seenRef = useRef<{ id: string | null; onSeen?: () => void }>({ id: null });
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
      awaitsExactRef.current = false;
      return;
    }
    if (scrolledToRef.current === highlightId) return;

    if (scrollToRow(listRef.current, groups, highlightId)) scrolledToRef.current = highlightId;
  }, [groups, highlightId]);

  const onRowLayout = () => {
    if (!awaitsExactRef.current) return;

    awaitsExactRef.current = false;
    if (highlightId) scrollToRow(listRef.current, groups, highlightId);
  };

  // A row already on screen when it is picked counts as seen at once.
  useEffect(() => {
    seenRef.current = { id: highlightId, onSeen: onHighlightSeen };
    if (highlightId && visibleIdsRef.current.includes(highlightId)) onHighlightSeen?.();
  }, [highlightId, onHighlightSeen]);

  // The list refuses a new handler once mounted, so it reads the current row from a ref.
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<TransactionModel>[] }) => {
    const { id, onSeen } = seenRef.current;

    visibleIdsRef.current = viewableItems.flatMap(({ item, isViewable }) => (isViewable && item ? [item.id] : []));
    if (id && visibleIdsRef.current.includes(id)) onSeen?.();
  }, []);

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
      // Rows far below are not measured yet: scroll near the row, then onto it once it renders.
      onScrollToIndexFailed={({ averageItemLength, index }) => {
        awaitsExactRef.current = true;
        listRef.current?.getScrollResponder()?.scrollTo({ y: averageItemLength * index, animated: false });
      }}
      viewabilityConfig={VIEWABILITY}
      onViewableItemsChanged={onViewableItemsChanged}
      renderSectionHeader={({ section }) => (
        <View style={[styles.groupHeader, section.isFirst ? styles.groupHeaderFirst : styles.groupHeaderSpaced]}>
          <Text style={styles.groupLabel}>{section.title}</Text>

          <Text style={[styles.groupTotal, section.total > 0 && styles.groupTotalPositive]}>
            {formatSignedAmount(section.total, currencyCode)}
          </Text>
        </View>
      )}
      renderItem={({ item }) => {
        const card = (
          <TransactionCard
            transaction={item}
            currencyCode={currencyCode}
            isHighlighted={item.id === highlightId}
            onPress={onPressTransaction}
            onDelete={onDeleteTransaction}
          />
        );

        return item.id === highlightId ? <View onLayout={onRowLayout}>{card}</View> : card;
      }}
    />
  );
};

export default TransactionsList;
