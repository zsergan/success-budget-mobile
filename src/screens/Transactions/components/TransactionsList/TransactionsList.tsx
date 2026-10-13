import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import type { ViewToken } from 'react-native';
import { ActivityIndicator, SectionList, Text, TouchableOpacity, View } from 'react-native';

import type { Money } from '@api/dto';
import { TransactionCard, useScreenTopInset } from '@components';
import type { TransactionModel } from '@api/models';
import { colors } from '@shared/theme';
import type { DayGroup } from '@shared/utils';
import { formatSignedAmount, toCents } from '@shared/utils';

import styles from './style';

interface Section {
  key: string;
  title: string;
  total: Money | null;
  /** The first header sits right under the filter bar and takes a smaller gap above it. */
  isFirst: boolean;
  data: TransactionModel[];
}

const ItemSeparator = () => <View style={styles.itemSeparator} />;

type Group = DayGroup & { total: Money | null };

interface Props {
  groups: Group[];
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
  older?: PageEdge;
  newer?: PageEdge;
  onRetryPage?: () => void;
}

interface PageEdge {
  hasMore: boolean;
  isLoading: boolean;
  hasError: boolean;
  // Called whenever this edge comes near; the caller decides whether a page is due.
  onReached: () => void;
}

// About half to one screen before an edge, so the next page is usually there before the user is.
const EDGE_THRESHOLD = 0.75;
const TOP_THRESHOLD = 10;

const PageStatus = ({ edge, onRetry }: { edge?: PageEdge; onRetry?: () => void }) => {
  if (edge?.hasError)
    return (
      <View style={styles.pageStatus}>
        <Text style={styles.pageError}>Couldn’t load more</Text>
        <TouchableOpacity onPress={onRetry} hitSlop={12} accessibilityRole="button">
          <Text style={styles.pageRetry}>Retry</Text>
        </TouchableOpacity>
      </View>
    );

  return edge?.isLoading ? (
    <ActivityIndicator style={styles.pageStatus} color={colors.accent} testID="history-loading-page" />
  ) : null;
};

const VIEWABILITY = { itemVisiblePercentThreshold: 60 };

// Whether the row is in the list to scroll to.
const scrollToRow = (list: SectionList<TransactionModel, Section> | null, groups: Group[], rowId: string) => {
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
  older,
  newer,
  onRetryPage,
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
      ListHeaderComponent={
        <>
          {header}
          <PageStatus edge={newer} onRetry={onRetryPage} />
        </>
      }
      ListEmptyComponent={placeholder}
      ListFooterComponent={<PageStatus edge={older} onRetry={onRetryPage} />}
      onEndReached={sections.length > 0 ? older?.onReached : undefined}
      onEndReachedThreshold={EDGE_THRESHOLD}
      onStartReached={sections.length > 0 ? newer?.onReached : undefined}
      onStartReachedThreshold={EDGE_THRESHOLD}
      // Rows added or dropped above keep the visible row in place; the header (child 0) never anchors. A dropped page
      // lies within the default 21-screen render window, so that row stays mounted. Kept on at all times: switching it
      // on later shifts the render window. At the newest record, a row saved while at the top is scrolled into view.
      maintainVisibleContentPosition={{
        minIndexForVisible: 1,
        ...(!newer?.hasMore && { autoscrollToTopThreshold: TOP_THRESHOLD }),
      }}
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

          {section.total !== null && (
            <Text style={[styles.groupTotal, toCents(section.total) > 0 && styles.groupTotalPositive]}>
              {formatSignedAmount(section.total, currencyCode)}
            </Text>
          )}
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
