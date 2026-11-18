import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import type { AssignmentBreakdownItem } from '@api/dto';
import type { AssignmentKey } from '@api/models';
import {
  Banner,
  ConfirmationSheet,
  Fab,
  PendingWritesBanner,
  RootLayout,
  SpaceSwitcher,
  useTransactionDelete,
  useTransactionFlow,
} from '@components';
import { useBalanceVisibility, useConfirmation, useRefreshOnReturn, useSpaceRefresh } from '@hooks';
import useStatsData from '@hooks/useStatsData';
import { getLoadState } from '@redux/api/loadState';
import { useAppSelector, useRecentArg } from '@redux/hooks';
import { selectProfileId } from '@redux/state/profile/selectors';
import {
  selectCurrentSpace,
  selectCurrentSpaceCurrencyCode,
  selectIsPersonalSpace,
} from '@redux/state/space/selectors';
import { useGetRecentTransactionsQuery } from '@redux/state/transaction/api';
import type { ViewSelection } from '@redux/state/transactionFlow/selection';
import { rangeSelection } from '@redux/state/transactionFlow/selection';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';
import { ScreenNames, TransactionType } from '@shared/enums';
import type { MainTabScreenProps } from '@shared/types';
import AssignmentSpending from './components/AssignmentSpending/AssignmentSpending';
import HomeEmpty from './components/HomeEmpty/HomeEmpty';
import MonthNavigator from './components/MonthNavigator/MonthNavigator';
import MonthNet from './components/MonthNet/MonthNet';
import RecentActivity from './components/RecentActivity/RecentActivity';
import TopSpending from './components/TopSpending/TopSpending';
import useHomeMonth from './hooks/useHomeMonth';

import styles from './style';

interface Props extends MainTabScreenProps<ScreenNames.HOME_TAB> {}

const monthName = (date: Date, withYear = false) =>
  date.toLocaleString('en-US', { month: 'long', ...(withYear && { year: 'numeric' }) });

// One month of the space: its net, where the expenses went and to whom, and its latest records. Every block reads
// the same month in the device's zone, and the totals are the server's, never sums of the rows on screen.
const HomeScreen = ({ navigation, route }: Props) => {
  useSpaceRefresh();
  const { lock: deleteLock, confirmation: deleteConfirmation } = useConfirmation();
  const { requestDelete } = useTransactionDelete(deleteLock);
  const space = useAppSelector(selectCurrentSpace);
  const isPersonal = useAppSelector(selectIsPersonalSpace);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const selfId = useAppSelector(selectProfileId);
  const { isHidden, toggle } = useBalanceVisibility();

  const month = useHomeMonth();
  const { range, isCurrent, showMonthOf } = month;
  const stats = useStatsData(range, TransactionType.EXPENSE, { withTrend: false });
  useRefreshOnReturn(stats.refreshIfStale);
  const recentQuery = useGetRecentTransactionsQuery(useRecentArg(range));
  const activity = getLoadState(recentQuery);

  // A new record is dated now whatever month is shown; one saved outside it brings Home to its month on View.
  const from = range.from.getTime();
  const to = range.to.getTime();
  const selection = useMemo<ViewSelection>(
    () => ({ ...rangeSelection({ from: new Date(from), to: new Date(to) }), origin: 'home' }),
    [from, to],
  );
  const { openCreate, openDetails } = useTransactionFlow(selection);

  const spaceId = space?.id ?? null;
  const showMonth = route.params?.showMonth;
  useEffect(() => {
    if (!showMonth) return;

    navigation.setParams({ showMonth: undefined });
    if (showMonth.spaceId === spaceId) showMonthOf(showMonth.month);
  }, [navigation, showMonth, spaceId, showMonthOf]);

  const summary = stats.summary.data;
  const breakdown = stats.breakdown.data;
  const isFresh = summary?.has_any_transactions === false;
  const isEmptyMonth = !!summary && summary.has_any_transactions && summary.transactions_count === 0;
  // What is shown stays, flagged, when a refresh of any block could not bring it up to date.
  const refreshFailed = stats.updateFailed || activity.hasRefreshError;
  const showsFailure = refreshFailed || stats.isUnreconciled;
  const anchor = range.from.toISOString();
  const currentName = monthName(new Date());

  const retry = () => {
    stats.retryFailed();
    recentQuery.refetch();
  };

  const openStats = (mode: 'category' | 'assignment') => {
    if (spaceId === null) return;

    navigation.navigate(ScreenNames.STATS_TAB, {
      screen: ScreenNames.STATS_OVERVIEW_SCREEN,
      params: { focus: { spaceId, month: anchor, transactionType: TransactionType.EXPENSE, mode } },
    });
  };

  const openHistory = (filters?: { assignment: AssignmentKey; assignmentName: string }) => {
    if (spaceId === null) return;

    navigation.navigate(ScreenNames.TRANSACTIONS_TAB, {
      focus: { spaceId, month: anchor, ...(filters && { transactionType: TransactionType.EXPENSE, ...filters }) },
    });
  };

  const openAssignment = (item: AssignmentBreakdownItem, name: string) =>
    openHistory({ assignment: item.key as AssignmentKey, assignmentName: name });

  return (
    <>
      <RootLayout
        style={styles.container}
        contentContainerStyle={{ paddingBottom: FAB_SCROLL_CLEARANCE }}
        edges={['top', 'left', 'right']}
        scrollable
        blurredStatusBar
      >
        <SpaceSwitcher navigation={navigation} />

        <MonthNavigator
          label={monthName(range.from, true)}
          isCurrent={isCurrent}
          currentName={currentName}
          onPrevious={month.showPrevious}
          onNext={month.showNext}
          onBackToCurrent={month.showCurrent}
        />

        {showsFailure && (
          <View style={styles.banner}>
            <Banner
              tone="danger"
              text={
                refreshFailed
                  ? 'Couldn’t update. Showing what was loaded before.'
                  : 'The figures changed while they loaded and may not add up.'
              }
              actionLabel="Retry"
              onAction={retry}
            />
          </View>
        )}

        <PendingWritesBanner style={styles.banner} />

        {isFresh ? (
          <HomeEmpty
            variant="fresh"
            spaceName={space?.name ?? 'this space'}
            onAddTransaction={() => openCreate(TransactionType.EXPENSE)}
          />
        ) : (
          <>
            <MonthNet
              monthName={monthName(range.from)}
              summary={summary}
              isLoading={stats.summary.isLoading}
              hasError={stats.summary.hasError}
              currencyCode={currencyCode}
              isHidden={isHidden}
              onToggleHidden={toggle}
              onRetry={stats.summary.retry}
            />

            {isEmptyMonth ? (
              <HomeEmpty
                variant="emptyMonth"
                monthName={monthName(range.from)}
                lastDate={summary.last_transaction_date}
                {...(!isCurrent && { currentName, onBackToCurrent: month.showCurrent })}
              />
            ) : (
              <>
                <TopSpending
                  breakdown={breakdown}
                  isLoading={stats.breakdown.isLoading}
                  hasError={stats.breakdown.hasError}
                  currencyCode={currencyCode}
                  isHidden={isHidden}
                  onSeeBreakdown={() => openStats('category')}
                  onRetry={stats.breakdown.retry}
                />

                {!isPersonal && (
                  <AssignmentSpending
                    breakdown={breakdown}
                    isLoading={stats.breakdown.isLoading}
                    hasError={stats.breakdown.hasError}
                    currencyCode={currencyCode}
                    isHidden={isHidden}
                    selfId={selfId}
                    subtitle={
                      space?.member_count === 1
                        ? 'Only you are active here. Shared history stays under Whole space.'
                        : undefined
                    }
                    onOpenRow={openAssignment}
                    onSeeAll={() => openStats('assignment')}
                    onRetry={stats.breakdown.retry}
                  />
                )}

                <RecentActivity
                  recent={recentQuery.currentData}
                  currencyCode={currencyCode}
                  isHidden={isHidden}
                  isLoading={activity.isLoading}
                  hasError={activity.hasError}
                  onRetry={recentQuery.refetch}
                  onViewAll={() => openHistory()}
                  onPressTransaction={openDetails}
                  onDeleteTransaction={requestDelete}
                />
              </>
            )}
          </>
        )}
      </RootLayout>

      <Fab onExpense={() => openCreate(TransactionType.EXPENSE)} onIncome={() => openCreate(TransactionType.INCOME)} />

      <ConfirmationSheet confirmation={deleteConfirmation} />
    </>
  );
};

export default HomeScreen;
