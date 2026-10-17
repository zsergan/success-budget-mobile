import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ViewToken } from 'react-native';
import { ActivityIndicator, ScrollView, SectionList, Text, TouchableOpacity, View } from 'react-native';

import type { Money } from '@api/dto';
import { TransactionCard, useScreenTopInset } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import type { TransactionModel } from '@api/models';
import type { DayGroup } from '@shared/utils';
import { formatSignedAmount, toCents } from '@shared/utils';

import createStyles from './style';

interface Section {
  key: string;
  title: string;
  total: Money | null;
  /** The first header sits right under the filter bar and takes a smaller gap above it. */
  isFirst: boolean;
  data: TransactionModel[];
}

const ItemSeparator = () => {
  const styles = useThemedStyles(createStyles);

  return <View style={styles.itemSeparator} />;
};

type Group = DayGroup & { total: Money | null };

interface Props {
  groups: Group[];
  // Which history is listed; a new one starts at the top.
  selectionKey: string;
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
  // A row to bring back to the top of the list, unlit, once it is listed.
  restoreId?: string | null;
  // Called once that row is in place, so the caller can drop it and it is never scrolled to again.
  onRestored?: () => void;
  // The rows on screen, top first, whenever they change.
  onVisibleRowsChange?: (ids: string[]) => void;
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

const PageStatus = ({ edge, onRetry }: { edge?: PageEdge; onRetry?: () => void }) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
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

interface ScrollTarget {
  id: string;
  viewPosition: number;
  viewOffset: number;
}

// Whether the row is in the list to scroll to.
const scrollToRow = (list: SectionList<TransactionModel, Section> | null, groups: Group[], target: ScrollTarget) => {
  const sectionIndex = groups.findIndex((group) => group.items.some(({ id }) => id === target.id));
  if (sectionIndex < 0) return false;

  // SectionList counts the section's header as its item 0.
  const itemIndex = groups[sectionIndex].items.findIndex(({ id }) => id === target.id) + 1;
  list?.scrollToLocation({ sectionIndex, itemIndex, viewPosition: target.viewPosition, viewOffset: target.viewOffset });
  return true;
};

const TransactionsList = ({
  groups,
  selectionKey,
  currencyCode,
  header,
  placeholder,
  onPressTransaction,
  onDeleteTransaction,
  highlightId = null,
  onHighlightSeen,
  restoreId = null,
  onRestored,
  onVisibleRowsChange,
  older,
  newer,
  onRetryPage,
}: Props) => {
  const styles = useThemedStyles(createStyles);
  const topInset = useScreenTopInset();
  const listRef = useRef<SectionList<TransactionModel, Section>>(null);
  const scrolledToRef = useRef<string | null>(null);
  // A scroll that had to land near the row, not on it, is repeated once the row is rendered and measured.
  const awaitsExactRef = useRef(false);
  const visibleIdsRef = useRef<string[]>([]);
  const seenRef = useRef<{ id: string | null; onSeen?: () => void; onVisibleRows?: (ids: string[]) => void }>({
    id: null,
  });
  const sections: Section[] = groups.map((group, index) => ({
    key: group.key,
    title: group.label,
    total: group.total,
    isFirst: index === 0,
    data: group.items,
  }));

  // A lit row is brought to the middle; a restored one to the top, just below the status bar.
  const targetId = highlightId ?? restoreId;
  const target = useMemo<ScrollTarget | null>(
    () =>
      highlightId
        ? { id: highlightId, viewPosition: 0.4, viewOffset: 0 }
        : restoreId
          ? { id: restoreId, viewPosition: 0, viewOffset: topInset }
          : null,
    [highlightId, restoreId, topInset],
  );

  const shownKeyRef = useRef(selectionKey);
  useEffect(() => {
    if (shownKeyRef.current === selectionKey) return;

    shownKeyRef.current = selectionKey;
    listRef.current?.getScrollResponder()?.scrollTo({ y: 0, animated: false });
  }, [selectionKey]);

  useEffect(() => {
    if (!target) {
      scrolledToRef.current = null;
      awaitsExactRef.current = false;
      return;
    }
    if (scrolledToRef.current === target.id) return;

    if (scrollToRow(listRef.current, groups, target)) {
      scrolledToRef.current = target.id;
      // A row not measured yet is landed on in onRowLayout; only then is the restore done.
      if (!awaitsExactRef.current && target.id === restoreId) onRestored?.();
    }
  }, [groups, target, restoreId, onRestored]);

  const onRowLayout = () => {
    if (!awaitsExactRef.current) return;

    awaitsExactRef.current = false;
    if (target) scrollToRow(listRef.current, groups, target);
    if (target?.id === restoreId) onRestored?.();
  };

  // A row already on screen when it is picked counts as seen at once.
  useEffect(() => {
    seenRef.current = { id: highlightId, onSeen: onHighlightSeen, onVisibleRows: onVisibleRowsChange };
    if (highlightId && visibleIdsRef.current.includes(highlightId)) onHighlightSeen?.();
  }, [highlightId, onHighlightSeen, onVisibleRowsChange]);

  // The list refuses a new handler once mounted, so it reads the current row from a ref.
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<TransactionModel>[] }) => {
    const { id, onSeen, onVisibleRows } = seenRef.current;

    visibleIdsRef.current = viewableItems.flatMap(({ item, isViewable }) => (isViewable && item ? [item.id] : []));
    onVisibleRows?.(visibleIdsRef.current);
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
      // Scrolling the results puts the keyboard away; a tap on a row still opens it at once.
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
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
      // While newer pages remain, rows added or dropped above keep the visible row in place; a dropped page lies
      // within the default 21-screen render window, so that row stays mounted.
      maintainVisibleContentPosition={newer?.hasMore ? { minIndexForVisible: 1 } : undefined}
      // Natively it stays on, as switching it on reuses a stale anchor. At the newest record it holds the header
      // (child 0), so what loads or changes height under it never moves the screen, and a new row shows up at the top.
      renderScrollComponent={(props) => (
        <ScrollView
          {...props}
          maintainVisibleContentPosition={{
            minIndexForVisible: props.maintainVisibleContentPosition?.minIndexForVisible ?? 0,
          }}
        />
      )}
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

        return item.id === targetId ? <View onLayout={onRowLayout}>{card}</View> : card;
      }}
    />
  );
};

export default TransactionsList;
